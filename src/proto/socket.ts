import {
  VarlinkConnectionClient,
  type VarlinkConnection,
  type VarlinkProtocolClient,
} from "./proto";
import type { SocketConnectOpts } from "node:net";
import { Socket } from "node:net";
import { once } from "node:events";

export class SocketProtocolClient implements VarlinkProtocolClient {
  constructor(private socketOpts: SocketConnectOpts & { timeout: number }) {}

  async open(): Promise<VarlinkConnectionClient> {
    let conn = new SocketConnection(this.socketOpts);
    await conn.connect();
    return new VarlinkConnectionClient(conn);
  }
}

export class SocketConnection implements VarlinkConnection {
  private socket: Socket;
  private chunks: Buffer[];
  private messages: Buffer[];
  private error?: Error;
  constructor(private socketOpts: SocketConnectOpts & { timeout: number }) {
    this.socket = new Socket();
    this.chunks = [];
    this.messages = [];

    this.socket.setTimeout(socketOpts.timeout, () =>
      this.socket.destroy(new Error("timeout exceeded"))
    );
    this.socket.on("data", (data) => {
      this.chunks.push(data);
      let idx = data.indexOf(0);
      if (idx !== -1) {
        this._parseMessages();
      }
    });
    this.socket.on("error", (error) => {
      this.error = error;
    });
  }

  async connect(): Promise<void> {
    this.socket.connect(this.socketOpts);
    await once(this.socket, "connect");
  }

  async send(request: Buffer): Promise<void> {
    let data = Buffer.concat([request, Buffer.from("\x00")]);
    if (!this.socket.write(data)) {
      await once(this.socket, "flush");
    }
  }

  async recv(): Promise<Buffer> {
    if (this.error) {
      let error = this.error;
      this.error = undefined;
      throw error;
    }
    while (true) {
      if (this.messages.length > 0) {
        return this.messages.shift() as Buffer;
      }
      await once(this.socket, "data");
    }
  }

  async close(): Promise<void> {
    return new Promise((res, _) => this.socket.end(res));
  }

  _parseMessages(): void {
    while (this.chunks.length > 0) {
      let lastChunk = this.chunks[this.chunks.length - 1];
      let lastChunkFirstZero = lastChunk.indexOf(0);
      if (lastChunkFirstZero === -1) {
        return;
      }

      let oldChunks = this.chunks.filter(
        (_, idx) => idx != this.chunks.length - 1
      );
      let lastChunkPrefix = lastChunk.subarray(0, lastChunkFirstZero);
      this.messages.push(Buffer.concat([...oldChunks, lastChunkPrefix]));

      if (lastChunkFirstZero === lastChunk.length - 1) {
        this.chunks = [];
      } else {
        let lastChunkSuffix = lastChunk.subarray(
          lastChunkFirstZero + 1,
          lastChunk.length
        );
        this.chunks = [lastChunkSuffix];
      }
    }
  }
}
