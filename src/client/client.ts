import {
  type VarlinkClientSideTransport,
  type VarlinkClientSideTransportChannel,
} from "../transport/transport";
import {
  VarlinkError,
  type VarlinkMethod,
  type VarlinkMethodGetInput,
  type VarlinkMethodGetOutput,
} from "../protocol/protocol";

export class VarlinkClient {
  private pool: VarlinkClientSideTransportChannel[] = [];
  constructor(private readonly transport: VarlinkClientSideTransport) {}

  async connect(): Promise<void> {
    const chan = await this.#takeFromPool();
    await this.#backToPool(chan);
  }

  async disconnect(): Promise<void> {
    await this.#drainPool();
  }

  async call<M extends VarlinkMethod<any, any, any>>(
    method: M,
    input: VarlinkMethodGetInput<M>
  ): Promise<VarlinkMethodGetOutput<M>> {
    const chan = await this.#takeFromPool();
    await chan.send({
      method: method.name,
      parameters: input,
      oneway: false,
      more: false,
      upgrade: false,
    });
    const resp = await chan.recv();
    await this.#backToPool(chan);

    if (resp.error) {
      throw new VarlinkError(resp.error, resp.parameters);
    }

    return resp.parameters as VarlinkMethodGetOutput<M>;
  }

  async callOneshot<M extends VarlinkMethod<any, any, any>>(
    method: M,
    input: VarlinkMethodGetInput<M>
  ): Promise<void> {
    const chan = await this.#takeFromPool();
    await chan.send({
      method: method.name,
      parameters: input,
      oneway: true,
      more: false,
      upgrade: false,
    });
    await this.#backToPool(chan);
  }

  async callStream<M extends VarlinkMethod<any, any, any>>(
    method: M,
    input: VarlinkMethodGetInput<M>,
    callbackFunction: (
      error: VarlinkError | undefined,
      data: VarlinkMethodGetOutput<M>
    ) => Promise<void>
  ): Promise<void> {
    const chan = await this.#takeFromPool();
    await chan.send({
      method: method.name,
      parameters: input,
      oneway: false,
      more: true,
      upgrade: false,
    });
    let continues = true;
    while (continues) {
      const resp = await chan.recv();
      if (resp.error) {
        await callbackFunction(
          new VarlinkError(resp.error, resp.parameters),
          {} as VarlinkMethodGetOutput<M>
        );
      } else {
        await callbackFunction(
          undefined,
          resp.parameters as VarlinkMethodGetOutput<M>
        );
      }
      continues = resp.continues ?? false;
    }

    await this.#backToPool(chan);
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
    const pool = this.pool;
    this.pool = [];
    await Promise.all(pool.map((chan) => chan.close));
  }
}
