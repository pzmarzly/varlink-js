import type { AddressInfo } from "node:net";
import { OrgVarlinkService } from "../schemas/org.varlink.service.varlink.ts";
import { SocketServerSideTransport } from "../transport/node-socket";
import { VarlinkServer } from "./server";
import { OrgVarlinkCertification } from "../schemas/org.varlink.certification.varlink.ts";
import { randomBytes } from "node:crypto";
import { VarlinkError, type VarlinkDictionary } from "../protocol/protocol.ts";
import { readFileSync } from "node:fs";

class ClientIdError extends VarlinkError {
  constructor() {
    super("org.varlink.certification.ClientIdError", {});
  }
}

class CertificationError extends VarlinkError {
  constructor(wants: VarlinkDictionary, got: VarlinkDictionary) {
    super("org.varlink.certification.CertificationError", { wants, got });
  }
}

export class ReferenceServer {
  private readonly transport: SocketServerSideTransport;
  private readonly server: VarlinkServer;
  private readonly clientStates = new Map<string, string>();

  constructor(port: number = 0) {
    this.transport = new SocketServerSideTransport({
      timeout: 10_000,
      port,
    });
    this.server = new VarlinkServer(this.transport);

    this.server.registerCall(
      OrgVarlinkService.GetInfo,
      this.#getInfo.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkService.GetInterfaceDescription,
      this.#getInterfaceDescription.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkCertification.Start,
      this.#start.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkCertification.Test01,
      this.#test01.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkCertification.Test02,
      this.#test02.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkCertification.Test03,
      this.#test03.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkCertification.Test04,
      this.#test04.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkCertification.Test05,
      this.#test05.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkCertification.Test06,
      this.#test06.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkCertification.Test07,
      this.#test07.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkCertification.Test08,
      this.#test08.bind(this),
    );

    this.server.registerCall(
      OrgVarlinkCertification.Test09,
      this.#test09.bind(this),
    );

    this.server.registerCallStream(
      OrgVarlinkCertification.Test10,
      this.#test10.bind(this),
    );

    this.server.registerCallOneshot(
      OrgVarlinkCertification.Test11,
      this.#test11.bind(this),
    );

    this.server.registerCall(OrgVarlinkCertification.End, this.#end.bind(this));
  }

  async start(): Promise<void> {
    await this.server.start();
  }

  async stop(): Promise<void> {
    await this.server.stop();
  }

  address(): AddressInfo | string | null {
    return this.transport.address();
  }

  async #getInfo(input: object): Promise<{
    interfaces: string[];
    vendor: string;
    product: string;
    version: string;
    url: string;
  }> {
    return {
      vendor: "varlink-js",
      product: "varlink-js",
      version: "0.0.1",
      url: "https://example.com",
      interfaces: ["org.varlink.certification", "org.varlink.service"],
    };
  }

  async #getInterfaceDescription(input: {
    interface: string;
  }): Promise<{ description: string }> {
    const description = readFileSync(
      new URL(`../schemas/${input.interface}.varlink`, import.meta.url),
      "utf-8",
    );
    return {
      description,
    };
  }

  async #start(input: object): Promise<{ client_id: string }> {
    const clientId = randomBytes(20).toString("hex");
    this.clientStates.set(clientId, "Start");
    return {
      client_id: clientId,
    };
  }

  async #test01(input: VarlinkDictionary): Promise<VarlinkDictionary> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Start") {
      throw new ClientIdError();
    }

    const wants = { client_id: input.client_id };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test01");
    return { bool: true };
  }

  async #test02(input: VarlinkDictionary): Promise<VarlinkDictionary> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test01") {
      throw new ClientIdError();
    }

    const wants = { client_id: input.client_id, bool: true };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test02");
    return { int: 42 };
  }

  async #test03(input: VarlinkDictionary): Promise<VarlinkDictionary> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test02") {
      throw new ClientIdError();
    }

    const wants = { client_id: input.client_id, int: 42 };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test03");
    return { float: Math.PI };
  }

  async #test04(input: VarlinkDictionary): Promise<VarlinkDictionary> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test03") {
      throw new ClientIdError();
    }

    const wants = { client_id: input.client_id, float: Math.PI };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test04");
    return { string: "varlink" };
  }

  async #test05(input: VarlinkDictionary): Promise<VarlinkDictionary> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test04") {
      throw new ClientIdError();
    }

    const wants = { client_id: input.client_id, string: "varlink" };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test05");
    return { bool: true, int: 42, float: Math.PI, string: "varlink" };
  }

  async #test06(input: VarlinkDictionary): Promise<VarlinkDictionary> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test05") {
      throw new ClientIdError();
    }

    const wants = {
      client_id: input.client_id,
      bool: true,
      int: 42,
      float: Math.PI,
      string: "varlink",
    };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test06");
    return {
      struct: { bool: true, int: 42, float: Math.PI, string: "varlink" },
    };
  }

  async #test07(input: VarlinkDictionary): Promise<VarlinkDictionary> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test06") {
      throw new ClientIdError();
    }

    const wants = {
      client_id: input.client_id,
      struct: {
        bool: true,
        int: 42,
        float: Math.PI,
        string: "varlink",
      },
    };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test07");
    return {
      map: { varlink: "awesome", dbus: "not awesome" },
    };
  }

  async #test08(input: VarlinkDictionary): Promise<VarlinkDictionary> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test07") {
      throw new ClientIdError();
    }

    const wants = {
      client_id: input.client_id,
      map: { varlink: "awesome", dbus: "not awesome" },
    };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test08");
    return {
      set: { awesome: {}, "not awesome": {} },
    };
  }

  async #test09(input: VarlinkDictionary): Promise<VarlinkDictionary> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test08") {
      throw new ClientIdError();
    }

    const wants = {
      client_id: input.client_id,
      set: { awesome: {}, "not awesome": {} },
    };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test09");
    return {
      mytype: {
        object: {},
        enum: "one",
        struct: { first: 42, second: "42" },
        array: ["a", "b", "c"],
        dictionary: { first: "42", second: "21" },
        stringset: { a: {}, b: {}, c: {} },
        nullable: undefined,
        nullable_array_struct: undefined,
        interface: {
          foo: undefined,
          anon: { foo: true, bar: false },
        },
      },
    };
  }

  async #test10(
    input: VarlinkDictionary,
    callback: (output: VarlinkDictionary, continues: boolean) => Promise<void>,
  ): Promise<void> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test09") {
      throw new ClientIdError();
    }

    const wants = {
      client_id: input.client_id,
      mytype: {
        object: {},
        enum: "one",
        struct: { first: 42, second: "42" },
        array: ["a", "b", "c"],
        dictionary: { first: "42", second: "21" },
        stringset: { a: {}, b: {}, c: {} },
        interface: {
          anon: { foo: true, bar: false },
        },
      },
    };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test10");
    await callback({ string: "a" }, true);
    await callback({ string: "b" }, true);
    await callback({ string: "c" }, false);
  }

  async #test11(input: VarlinkDictionary): Promise<void> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test10") {
      throw new ClientIdError();
    }

    const wants = {
      client_id: input.client_id,
      last_more_replies: ["a", "b", "c"],
    };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "Test11");
  }

  async #end(input: VarlinkDictionary): Promise<VarlinkDictionary> {
    if (!this.clientStates.has(input.client_id as string)) {
      throw new ClientIdError();
    }
    if (this.clientStates.get(input.client_id as string) !== "Test11") {
      throw new ClientIdError();
    }

    const wants = {
      client_id: input.client_id,
    };
    if (!isEqual(wants, input)) {
      throw new CertificationError(wants, input);
    }

    this.clientStates.set(input.client_id as string, "End");
    return { all_ok: true };
  }
}

function isEqual<T>(a: T, b: T): boolean {
  if (a === b) {
    return true;
  }

  const bothAreObjects =
    a !== null && b !== null && typeof a === "object" && typeof b === "object";

  return Boolean(
    bothAreObjects &&
      Object.keys(a).length === Object.keys(b).length &&
      Object.entries(a).every(([k, v]) => isEqual(v, b[k as keyof T])),
  );
}
