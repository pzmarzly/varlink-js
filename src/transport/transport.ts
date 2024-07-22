import {
  deserializeVarlinkRequest,
  deserializeVarlinkResponse,
  serializeVarlinkRequest,
  serializeVarlinkResponse,
  type VarlinkRequest,
  type VarlinkResponse,
} from "../protocol/protocol";

export interface VarlinkTransportChannel {
  send: (request: Uint8Array) => Promise<void>;
  recv: () => Promise<Uint8Array>;
  close: () => Promise<void>;
}

export class VarlinkClientSideTransportChannel {
  constructor(private readonly chan: VarlinkTransportChannel) {}

  async send(request: VarlinkRequest): Promise<void> {
    await this.chan.send(serializeVarlinkRequest(request));
  }

  async recv(): Promise<VarlinkResponse> {
    return deserializeVarlinkResponse(await this.chan.recv());
  }

  async close(): Promise<void> {
    await this.chan.close();
  }
}

export class VarlinkServerSideTransportChannel {
  constructor(private readonly chan: VarlinkTransportChannel) {}

  async send(response: VarlinkResponse): Promise<void> {
    await this.chan.send(serializeVarlinkResponse(response));
  }

  async recv(): Promise<VarlinkRequest> {
    return deserializeVarlinkRequest(await this.chan.recv());
  }

  async close(): Promise<void> {
    await this.chan.close();
  }
}

export interface VarlinkClientSideTransport {
  connect: () => Promise<VarlinkClientSideTransportChannel>;
}

export interface VarlinkServerSideTransport {
  onClientConnected: (
    callback: (chan: VarlinkServerSideTransportChannel) => void
  ) => void;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}
