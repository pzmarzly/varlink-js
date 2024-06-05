import type { VarlinkConnectionProtocol } from "../connection/connection";
import {
  VarlinkClientSideConnection,
  type VarlinkDictionary,
} from "../protocol/protocol";

export class VarlinkError extends Error {
  constructor(
    public type_: string,
    public parameters: VarlinkDictionary
  ) {
    super(`${type_} ${JSON.stringify(parameters)}`);
    this.name = this.constructor.name;
  }
}

export class VarlinkClient {
  private conn?: VarlinkClientSideConnection;
  constructor(private proto: VarlinkConnectionProtocol) {}

  async connect(): Promise<void> {
    await this.#connect();
  }

  async #connect(): Promise<VarlinkClientSideConnection> {
    if (!this.conn) {
      let rawConn = await this.proto.open();
      this.conn = new VarlinkClientSideConnection(rawConn);
    }
    return this.conn;
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
    parameters: VarlinkDictionary
  ): Promise<VarlinkDictionary> {
    let conn = await this.#connect();
    await conn.send({
      method,
      parameters,
      oneway: false,
      more: false,
      upgrade: false,
    });
    let resp = await conn.recv();
    if (resp.error) {
      throw new VarlinkError(resp.error, resp.parameters);
    }
    return resp.parameters;
  }

  async callOneshot(
    method: string,
    parameters: VarlinkDictionary
  ): Promise<void> {
    let conn = await this.#connect();
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
    callbackFn: (err: VarlinkError | null, data: VarlinkDictionary) => void
  ): Promise<void> {
    let conn = await this.#connect();
    await conn.send({
      method,
      parameters,
      oneway: false,
      more: true,
      upgrade: false,
    });
    while (true) {
      let resp = await conn.recv();
      if (resp.error) {
        callbackFn(new VarlinkError(resp.error, resp.parameters), {});
        continue;
      }
      callbackFn(null, resp.parameters);
      if (resp.continues) {
        continue;
      }
      break;
    }
  }
}
