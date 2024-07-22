/* eslint "@typescript-eslint/no-unsafe-assignment": "off" */
/* eslint "@typescript-eslint/naming-convention": "off" */

import { test, expect } from "bun:test";
import { SocketTransport } from "../transport/node-socket";
import { VarlinkClientSideTransport } from "../transport/transport";
import { VarlinkDynamicMethod } from "../protocol/protocol";
import { OrgVarlinkService } from "../schemas/org.varlink.service.varlink.ts";
import { VarlinkClient } from "./client";
import { OrgVarlinkCertification } from "../schemas/org.varlink.certification.varlink.ts";

// cd varlink-python
// python3 -m varlink.tests.test_certification --varlink=tcp:127.0.0.1:12345
function getClient(): VarlinkClient {
  const transport = new SocketTransport({
    host: "127.0.0.1",
    port: 12_345,
    timeout: 10_000,
  });
  return new VarlinkClient(new VarlinkClientSideTransport(transport));
}

test("connects to the reference server (dynamic)", async () => {
  const GetInfo = new VarlinkDynamicMethod("org.varlink.service.GetInfo");
  const client = getClient();
  const info = await client.call(GetInfo, {});
  expect(info).toBeObject();
  expect(info.interfaces).toBeArray();
  const interfaces = info.interfaces as string[];
  interfaces.sort();
  expect(interfaces).toEqual([
    "org.varlink.certification",
    "org.varlink.service",
  ]);
});

test("connects to the reference server (typed)", async () => {
  const client = getClient();
  const info = await client.call(OrgVarlinkService.GetInfo, {});
  const interfaces = info.interfaces;
  interfaces.sort();
  expect(interfaces).toEqual([
    "org.varlink.certification",
    "org.varlink.service",
  ]);
});

test("exposes error details", async () => {
  const UnknownMethod = new VarlinkDynamicMethod(
    "org.varlink.unknown.UnknownMethod"
  );
  const client = getClient();
  expect(async () => client.call(UnknownMethod, {})).toThrow(
    'org.varlink.service.InterfaceNotFound {"interface":"org.varlink.unknown"}'
  );
});

test("passes reference tests", async () => {
  const client = getClient();
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
      expect(error).toBeUndefined();
      returnValue10.push(data);
    }
  );

  await client.callOneshot(OrgVarlinkCertification.Test11, {
    client_id: returnValueStart.client_id,
    last_more_replies: returnValue10.map((x) => x.string as string),
  });

  const returnValueEnd = await client.call(
    OrgVarlinkCertification.End,
    returnValueStart
  );
  expect(returnValueEnd.all_ok).toBeTrue();
});
