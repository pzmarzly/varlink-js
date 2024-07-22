import {
  deserializeVarlinkResponse,
  serializeVarlinkRequest,
  type VarlinkRequest,
  type VarlinkResponse,
} from "../protocol/protocol";

export interface VarlinkTransport {
  open: () => Promise<VarlinkTransportChannel>;
}

export interface VarlinkTransportChannel {
  send: (request: Uint8Array) => Promise<void>;
  recv: () => Promise<Uint8Array>;
  close: () => Promise<void>;
}

export class VarlinkClientSideTransport {
  constructor(private readonly transport: VarlinkTransport) {}

  async open(): Promise<VarlinkClientSideTransportChannel> {
    const chan = await this.transport.open();
    return new VarlinkClientSideTransportChannel(chan);
  }
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
