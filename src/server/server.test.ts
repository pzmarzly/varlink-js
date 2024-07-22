import { test } from "bun:test";
import { SocketServerSideTransport } from "../transport/node-socket";
import { VarlinkServer } from "./server";
import { OrgVarlinkService } from "../schemas/org.varlink.service.varlink.ts";

test("transport starts and stops", async () => {
  const transport = new SocketServerSideTransport({
    timeout: 10_000,
    port: 12346,
  });
  transport.onClientConnected((chan) => console.log(chan));
  await transport.start();
  await transport.stop();
});

test("server starts and stops", async () => {
  const transport = new SocketServerSideTransport({
    timeout: 10_000,
    port: 12346,
  });
  const server = new VarlinkServer(transport);
  await server.start();
  await server.stop();
});

test("serves interface", async () => {
  const transport = new SocketServerSideTransport({
    timeout: 10_000,
    port: 12346,
  });
  const server = new VarlinkServer(transport);
  server.registerCall(OrgVarlinkService.GetInfo, async (_input) => ({
    vendor: "varlink-js",
    product: "varlink-js",
    version: "0.0.1",
    url: "https://example.com",
    interfaces: [],
  }));
});
