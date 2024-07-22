import {
  VarlinkClientSideTransport,
  VarlinkClientSideTransportChannel,
} from "../transport/transport";
import { VarlinkError, type VarlinkDictionary } from "../protocol/protocol";

export class VarlinkClient {
  private pool: VarlinkClientSideTransportChannel[] = [];
  constructor(private readonly transport: VarlinkClientSideTransport) {}

  async connect(): Promise<void> {
    const chan = await this.#takeFromPool();
    this.#backToPool(chan);
  }

  async disconnect(): Promise<void> {
    await this.#drainPool();
  }

  async call(
    method: string,
    parameters: VarlinkDictionary
  ): Promise<VarlinkDictionary> {
    const chan = await this.#takeFromPool();
    await chan.send({
      method,
      parameters,
      oneway: false,
      more: false,
      upgrade: false,
    });
    const resp = await chan.recv();
    this.#backToPool(chan);

    if (resp.error) {
      throw new VarlinkError(resp.error, resp.parameters);
    }
    return resp.parameters;
  }

  async callOneshot(
    method: string,
    parameters: VarlinkDictionary
  ): Promise<void> {
    const chan = await this.#takeFromPool();
    await chan.send({
      method,
      parameters,
      oneway: true,
      more: false,
      upgrade: false,
    });
    this.#backToPool(chan);
  }

  async callStream(
    method: string,
    parameters: VarlinkDictionary,
    callbackFunction: (
      error: VarlinkError | undefined,
      data: VarlinkDictionary
    ) => void
  ): Promise<void> {
    const chan = await this.#takeFromPool();
    await chan.send({
      method,
      parameters,
      oneway: false,
      more: true,
      upgrade: false,
    });
    let continues = true;
    while (continues) {
      const resp = await chan.recv();
      if (resp.error) {
        callbackFunction(new VarlinkError(resp.error, resp.parameters), {});
        continue;
      }

      callbackFunction(undefined, resp.parameters);
      continues = resp.continues ?? false;
    }
    this.#backToPool(chan);
  }

  async #takeFromPool(): Promise<VarlinkClientSideTransportChannel> {
    if (this.pool.length === 0) {
      return this.transport.open();
    }

    return this.pool.shift()!;
  }

  async #backToPool(chan: VarlinkClientSideTransportChannel): Promise<void> {
    this.pool.push(chan);
  }

  async #drainPool(): Promise<void> {
    let pool = this.pool;
    this.pool = [];
    await Promise.all(pool.map((chan) => chan.close));
  }
}
