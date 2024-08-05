import { test } from "poku";
import { SocketServerSideTransport } from "../transport/node-socket";
import { VarlinkServer } from "./server";
import { OrgVarlinkService } from "../schemas/org.varlink.service.varlink.ts";

await test("transport starts and stops", async () => {
  const transport = new SocketServerSideTransport({
    timeout: 10_000,
    port: 12346,
  });
  transport.onClientConnected((chan) => {
    console.log(chan);
  });
  await transport.start();
  await transport.stop();
});

await test("server starts and stops", async () => {
  const transport = new SocketServerSideTransport({
    timeout: 10_000,
    port: 12346,
  });
  const server = new VarlinkServer(transport);
  await server.start();
  await server.stop();
});

await test("serves interface", async () => {
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
