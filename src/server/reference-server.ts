import type { AddressInfo } from "net";
import { OrgVarlinkService } from "../schemas/org.varlink.service.varlink.ts";
import { SocketServerSideTransport } from "../transport/node-socket";
import { VarlinkServer } from "./server";

export class ReferenceServer {
  private readonly transport: SocketServerSideTransport;
  private readonly server: VarlinkServer;

  constructor() {
    this.transport = new SocketServerSideTransport({
      timeout: 10_000,
      port: 0,
    });
    this.server = new VarlinkServer(this.transport);

    this.server.registerCall(OrgVarlinkService.GetInfo, async (_input) => ({
      vendor: "varlink-js",
      product: "varlink-js",
      version: "0.0.1",
      url: "https://example.com",
      interfaces: ["org.varlink.certification", "org.varlink.service"],
    }));
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
}
