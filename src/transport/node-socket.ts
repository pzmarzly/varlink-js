import {type SocketConnectOpts, Socket} from 'node:net';
import {once} from 'node:events';
import {
  type VarlinkTransport,
  type VarlinkTransportChannel,
} from './transport';

export class SocketTransport implements VarlinkTransport {
  constructor(
    private readonly socketOptions: SocketConnectOpts & {timeout: number},
  ) {}

  async open(): Promise<VarlinkTransportChannel> {
    const chan = new SocketTransportChannel(this.socketOptions);
    await chan.connect();
    return chan;
  }
}

export class SocketTransportChannel implements VarlinkTransportChannel {
  private readonly socket: Socket;
  private chunks: Uint8Array[];
  private readonly messages: Uint8Array[];
  private error?: Error;

  constructor(
    private readonly socketOptions: SocketConnectOpts & {timeout: number},
  ) {
    this.socket = new Socket();
    this.chunks = [];
    this.messages = [];

    this.socket.setTimeout(socketOptions.timeout, () =>
      this.socket.destroy(new Error('timeout exceeded')),
    );
    this.socket.on('data', data => {
      this.chunks.push(data);
      const index = data.indexOf(0);
      if (index !== -1) {
        this._parseMessages();
      }
    });
    this.socket.on('error', error => {
      this.error = error;
    });
  }

  async connect(): Promise<void> {
    this.socket.connect(this.socketOptions);
    await once(this.socket, 'connect');
  }

  async send(request: Uint8Array): Promise<void> {
    const data = concatArrays([request, Uint8Array.from([0])]);
    if (!this.socket.write(data)) {
      await once(this.socket, 'flush');
    }
  }

  async recv(): Promise<Uint8Array> {
    if (this.error) {
      const error = this.error;
      this.error = undefined;
      throw error;
    }

    while (this.messages.length === 0) {
      await once(this.socket, 'data');
    }

    return this.messages.shift()!;
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve, _) => {
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
        (_, index) => index !== this.chunks.length - 1,
      );
      const lastChunkPrefix = lastChunk.subarray(0, lastChunkFirstZero);
      this.messages.push(concatArrays([...oldChunks, lastChunkPrefix]));

      if (lastChunkFirstZero === lastChunk.length - 1) {
        this.chunks = [];
      } else {
        const lastChunkSuffix = lastChunk.subarray(
          lastChunkFirstZero + 1,
          lastChunk.length,
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
    0,
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
