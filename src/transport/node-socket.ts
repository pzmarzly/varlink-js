import {
  type SocketConnectOpts,
  type ServerOpts,
  Socket,
  Server,
  type ListenOptions,
  type AddressInfo,
} from "node:net";
import { once } from "node:events";
import {
  VarlinkClientSideTransportChannel,
  type VarlinkClientSideTransport,
  type VarlinkTransportChannel,
  VarlinkServerSideTransportChannel,
  type VarlinkServerSideTransport,
} from "./transport";

export class SocketClientSideTransport implements VarlinkClientSideTransport {
  constructor(
    private readonly socketOptions: SocketConnectOpts & { timeout: number }
  ) {}

  async connect(): Promise<VarlinkClientSideTransportChannel> {
    const socket = new Socket();
    const chan = new VarlinkClientSideTransportChannel(
      new SocketTransportChannel(socket)
    );

    socket.setTimeout(this.socketOptions.timeout, () =>
      socket.destroy(new Error("timeout exceeded"))
    );
    socket.connect(this.socketOptions);
    await once(socket, "connect");

    return chan;
  }
}

export class SocketServerSideTransport implements VarlinkServerSideTransport {
  private server: Server;

  constructor(
    private readonly serverOptions: ServerOpts &
      ListenOptions & { timeout: number }
  ) {
    this.server = new Server(serverOptions);
    this.server.on("error", (err) => {
      throw err;
    });
  }

  onClientConnected(
    callback: (chan: VarlinkServerSideTransportChannel) => void
  ): void {
    this.server.on("connection", (socket) => {
      const chan = new VarlinkServerSideTransportChannel(
        new SocketTransportChannel(socket)
      );
      socket.setTimeout(this.serverOptions.timeout, () =>
        socket.destroy(new Error("timeout exceeded"))
      );
      callback(chan);
    });
  }

  async start(): Promise<void> {
    const fut = once(this.server, "listening");
    this.server.listen(this.serverOptions);
    await fut;
  }

  address(): AddressInfo | string | null {
    return this.server.address();
  }

  async stop(): Promise<void> {
    const fut = once(this.server, "close");
    this.server.close();
    await fut;
  }
}

export class SocketTransportChannel implements VarlinkTransportChannel {
  private chunks: Uint8Array[];
  private messages: Uint8Array[];
  private error?: Error;

  constructor(private readonly socket: Socket) {
    this.chunks = [];
    this.messages = [];

    this.socket.on("data", (data) => {
      this.chunks.push(data);
      const index = data.indexOf(0);
      if (index !== -1) {
        this._parseMessages();
      }
    });
    this.socket.on("error", (error) => {
      this.error = error;
    });
  }

  async send(request: Uint8Array): Promise<void> {
    const data = concatArrays([request, Uint8Array.from([0])]);
    if (!this.socket.write(data)) {
      await once(this.socket, "flush");
    }
  }

  async recv(): Promise<Uint8Array> {
    if (this.error != null) {
      const error = this.error;
      this.error = undefined;
      throw error;
    }

    while (this.messages.length === 0) {
      await once(this.socket, "data");
    }

    return this.messages.shift()!;
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.socket.end(resolve);
    });
  }

  _parseMessages(): void {
    while (this.chunks.length > 0) {
      const lastChunk = this.chunks.at(-1)!;
      const lastChunkFirstZero = lastChunk.indexOf(0);
      if (lastChunkFirstZero === -1) {
        return;
      }

      const oldChunks = this.chunks.filter(
        (_, index) => index !== this.chunks.length - 1
      );
      const lastChunkPrefix = lastChunk.subarray(0, lastChunkFirstZero);
      this.messages.push(concatArrays([...oldChunks, lastChunkPrefix]));

      if (lastChunkFirstZero === lastChunk.length - 1) {
        this.chunks = [];
      } else {
        const lastChunkSuffix = lastChunk.subarray(
          lastChunkFirstZero + 1,
          lastChunk.length
        );
        this.chunks = [lastChunkSuffix];
      }
    }
  }
}

// https://stackoverflow.com/a/76332760
function concatArrays(arrays: Uint8Array[]): Uint8Array {
  const totalSize = arrays.reduce(
    (accumulator, array) => accumulator + array.length,
    0
  );
  const merged = new Uint8Array(totalSize);

  for (let i = 0; i < arrays.length; i++) {
    const offset = arrays
      .slice(0, i)
      .reduce((accumulator, array) => accumulator + array.length, 0);
    merged.set(arrays[i], offset);
  }

  return merged;
}
