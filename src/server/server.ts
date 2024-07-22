import {
  VarlinkError,
  type VarlinkDictionary,
  type VarlinkMethod,
  type VarlinkMethodGetOutput,
  type VarlinkMethodGetInput,
} from "../protocol/protocol";
import type {
  VarlinkServerSideTransport,
  VarlinkServerSideTransportChannel,
} from "../transport/transport";

type RegisteredHandler =
  | {
      type_: "call";
      fn: (input: VarlinkDictionary) => Promise<VarlinkDictionary>;
    }
  | { type_: "callOneshot"; fn: (input: VarlinkDictionary) => Promise<void> }
  | {
      type_: "callStream";
      fn: (
        input: VarlinkDictionary,
        callback: (
          output: VarlinkDictionary,
          continues: boolean,
        ) => Promise<void>,
      ) => Promise<void>;
    };

export class VarlinkServer {
  private readonly registeredHandlers = new Map<string, RegisteredHandler>();

  constructor(private readonly transport: VarlinkServerSideTransport) {
    transport.onClientConnected((chan) => {
      void this.#handleClient(chan);
    });
  }

  async start(): Promise<void> {
    await this.transport.start();
  }

  async stop(): Promise<void> {
    await this.transport.stop();
  }

  registerCall<M extends VarlinkMethod<string, any, any>>(
    method: M,
    fn: (input: VarlinkMethodGetInput<M>) => Promise<VarlinkMethodGetOutput<M>>,
  ): void {
    this.registeredHandlers.set(method.name, {
      type_: "call",
      fn: async (input) => {
        // TODO: Validate input.
        return await fn(input as VarlinkMethodGetInput<M>);
      },
    });
  }

  registerCallOneshot<M extends VarlinkMethod<string, any, any>>(
    method: M,
    fn: (input: VarlinkMethodGetInput<M>) => Promise<void>,
  ): void {
    this.registeredHandlers.set(method.name, {
      type_: "callOneshot",
      fn: async (input) => {
        // TODO: Validate input.
        await fn(input as VarlinkMethodGetInput<M>);
      },
    });
  }

  registerCallStream<M extends VarlinkMethod<string, any, any>>(
    method: M,
    fn: (
      input: VarlinkMethodGetInput<M>,
      callback: (
        output: VarlinkMethodGetOutput<M>,
        continues: boolean,
      ) => Promise<void>,
    ) => Promise<void>,
  ): void {
    this.registeredHandlers.set(method.name, {
      type_: "callStream",
      fn: async (input, callback) => {
        // TODO: Validate input.
        await fn(input as VarlinkMethodGetInput<M>, callback);
      },
    });
  }

  async #handleClient(chan: VarlinkServerSideTransportChannel): Promise<void> {
    while (true) {
      const request = await chan.recv();
      const handler = this.registeredHandlers.get(request.method);
      if (handler === undefined) {
        await sendErr(chan, new Error(`unknown method ${request.method}`));
        continue;
      }

      let requestedHandlerType;
      if (request.oneway) {
        requestedHandlerType = "callOneshot";
      } else if (request.more) {
        requestedHandlerType = "callStream";
      } else {
        requestedHandlerType = "call";
      }

      if (handler.type_ !== requestedHandlerType) {
        await sendErr(
          chan,
          new Error(
            `method ${request.method} is a ${handler.type_}, not a ${requestedHandlerType}`,
          ),
        );
        continue;
      }

      if (handler.type_ === "callOneshot") {
        try {
          await handler.fn(request.parameters);
        } catch (e) {
          console.warn(e);
        }
      } else if (handler.type_ === "callStream") {
        try {
          await handler.fn(
            request.parameters,
            async (parameters, continues) => {
              await sendOk(chan, parameters, continues);
            },
          );
        } catch (e) {
          console.warn(e);
          if (e instanceof Error) await sendErr(chan, e);
        }
      } else if (handler.type_ === "call") {
        try {
          const output = await handler.fn(request.parameters);
          await sendOk(chan, output, false);
        } catch (e) {
          console.warn(e);
          if (e instanceof Error) await sendErr(chan, e);
        }
      }
    }
  }
}

async function sendOk(
  chan: VarlinkServerSideTransportChannel,
  parameters: VarlinkDictionary,
  continues: boolean,
): Promise<void> {
  await chan.send({
    error: undefined,
    parameters,
    continues,
  });
}

async function sendErr(
  chan: VarlinkServerSideTransportChannel,
  error: Error,
): Promise<void> {
  if (error instanceof VarlinkError) {
    await chan.send({
      error: error.type_,
      parameters: error.parameters,
      continues: undefined,
    });
  } else {
    await chan.send({
      error: "org.varlink.service.InvalidParameter",
      parameters: { parameter: error.toString() },
      continues: undefined,
    });
  }
}
