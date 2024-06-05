import type {VarlinkConnectionProtocol} from '../connection/connection';
import {
  VarlinkClientSideConnection,
  type VarlinkDictionary,
} from '../protocol/protocol';

export class VarlinkError extends Error {
  constructor(
    public type_: string,
    public parameters: VarlinkDictionary,
  ) {
    super(`${type_} ${JSON.stringify(parameters)}`);
    this.name = this.constructor.name;
  }
}

export class VarlinkClient {
  private conn?: VarlinkClientSideConnection;
  constructor(private readonly proto: VarlinkConnectionProtocol) {}

  async connect(): Promise<void> {
    await this.#connect();
  }

  async disconnect(): Promise<void> {
    if (this.conn) {
      await this.conn.close();
      this.conn = undefined;
    }
  }

  fork(): VarlinkClient {
    return new VarlinkClient(this.proto);
  }

  async call(
    method: string,
    parameters: VarlinkDictionary,
  ): Promise<VarlinkDictionary> {
    const conn = await this.#connect();
    await conn.send({
      method,
      parameters,
      oneway: false,
      more: false,
      upgrade: false,
    });
    const resp = await conn.recv();
    if (resp.error) {
      throw new VarlinkError(resp.error, resp.parameters);
    }

    return resp.parameters;
  }

  async callOneshot(
    method: string,
    parameters: VarlinkDictionary,
  ): Promise<void> {
    const conn = await this.#connect();
    await conn.send({
      method,
      parameters,
      oneway: true,
      more: false,
      upgrade: false,
    });
  }

  async callStream(
    method: string,
    parameters: VarlinkDictionary,
    callbackFunction: (
      error: VarlinkError | undefined,
      data: VarlinkDictionary
    ) => void,
  ): Promise<void> {
    const conn = await this.#connect();
    await conn.send({
      method,
      parameters,
      oneway: false,
      more: true,
      upgrade: false,
    });
    let continues = true;
    while (continues) {
      const resp = await conn.recv();
      if (resp.error) {
        callbackFunction(new VarlinkError(resp.error, resp.parameters), {});
        continue;
      }

      callbackFunction(undefined, resp.parameters);
      continues = resp.continues ?? false;
    }
  }

  async #connect(): Promise<VarlinkClientSideConnection> {
    if (!this.conn) {
      const rawConn = await this.proto.open();
      this.conn = new VarlinkClientSideConnection(rawConn);
    }

    return this.conn;
  }
}
