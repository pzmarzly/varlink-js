import { test, assert } from "poku";
import { SocketClientSideTransport } from "../transport/node-socket";
import { VarlinkDynamicMethod } from "../protocol/protocol";
import { OrgVarlinkService } from "../schemas/org.varlink.service.varlink.ts";
import { VarlinkClient } from "./client";
import { OrgVarlinkCertification } from "../schemas/org.varlink.certification.varlink.ts";
import { ReferenceServer } from "../server/reference-server.ts";

let server: ReferenceServer | undefined;
let transport: SocketClientSideTransport;
if (process.env.PORT !== undefined) {
  server = undefined;
  transport = new SocketClientSideTransport({
    host: "127.0.0.1",
    // python3 -m varlink.tests.test_certification --varlink=tcp:127.0.0.1:12345
    port: Number(process.env.PORT),
    timeout: 10_000,
  });
} else {
  server = new ReferenceServer();
  await server.start();
  const address = server.address();
  if (address === null || typeof address !== "object") {
    throw new Error(`unknown address type ${address}`);
  }
  transport = new SocketClientSideTransport({
    timeout: 10_000,
    host: address.address,
    port: address.port,
  });
}
let client = new VarlinkClient(transport);

await test("connects to the reference server (dynamic)", async () => {
  const GetInfo = new VarlinkDynamicMethod("org.varlink.service.GetInfo");
  const info = await client.call(GetInfo, {});
  const interfaces = info.interfaces;
  interfaces.sort();
  assert.deepEqual(interfaces, [
    "org.varlink.certification",
    "org.varlink.service",
  ]);
});

await test("connects to the reference server (typed)", async () => {
  const info = await client.call(OrgVarlinkService.GetInfo, {});
  const interfaces = info.interfaces;
  interfaces.sort();
  assert.deepEqual(interfaces, [
    "org.varlink.certification",
    "org.varlink.service",
  ]);
});

await test("exposes error details", async () => {
  const UnknownMethod = new VarlinkDynamicMethod(
    "org.varlink.unknown.UnknownMethod"
  );
  assert.rejects(() => client.call(UnknownMethod, {}), /org.varlink.unknown/);
});

await test("passes reference tests", async () => {
  const returnValueStart = await client.call(OrgVarlinkCertification.Start, {});

  const returnValue01 = await client.call(OrgVarlinkCertification.Test01, {
    client_id: returnValueStart.client_id,
  });

  const returnValue02 = await client.call(OrgVarlinkCertification.Test02, {
    client_id: returnValueStart.client_id,
    bool: returnValue01.bool,
  });

  const returnValue03 = await client.call(OrgVarlinkCertification.Test03, {
    client_id: returnValueStart.client_id,
    int: returnValue02.int,
  });

  const returnValue04 = await client.call(OrgVarlinkCertification.Test04, {
    client_id: returnValueStart.client_id,
    float: returnValue03.float,
  });

  const returnValue05 = await client.call(OrgVarlinkCertification.Test05, {
    client_id: returnValueStart.client_id,
    string: returnValue04.string,
  });

  const returnValue06 = await client.call(OrgVarlinkCertification.Test06, {
    client_id: returnValueStart.client_id,
    bool: returnValue05.bool,
    int: returnValue05.int,
    float: returnValue05.float,
    string: returnValue05.string,
  });

  const returnValue07 = await client.call(OrgVarlinkCertification.Test07, {
    client_id: returnValueStart.client_id,
    struct: returnValue06.struct,
  });

  const returnValue08 = await client.call(OrgVarlinkCertification.Test08, {
    client_id: returnValueStart.client_id,
    map: returnValue07.map,
  });

  const returnValue09 = await client.call(OrgVarlinkCertification.Test09, {
    client_id: returnValueStart.client_id,
    set: returnValue08.set,
  });

  const returnValue10: any[] = [];
  await client.callStream(
    OrgVarlinkCertification.Test10,
    {
      client_id: returnValueStart.client_id,
      mytype: returnValue09.mytype,
    },
    async (error, data) => {
      assert.equal(error, undefined);
      returnValue10.push(data);
    }
  );

  await client.callOneshot(OrgVarlinkCertification.Test11, {
    client_id: returnValueStart.client_id,
    last_more_replies: returnValue10.map((x) => x.string),
  });

  const returnValueEnd = await client.call(
    OrgVarlinkCertification.End,
    returnValueStart
  );
  assert.equal(returnValueEnd.all_ok, true);
});

await test("disconnects", async () => {
  await client.disconnect();
  await server?.stop();
});
