/* eslint "@typescript-eslint/no-unsafe-assignment": "off" */
/* eslint "@typescript-eslint/naming-convention": "off" */

import { test, expect } from "bun:test";
import { SocketTransport } from "../transport/node-socket";
import { VarlinkClient } from "./client";
import { VarlinkClientSideTransport } from "../transport/transport";

function getClient(): VarlinkClient {
  const transport = new SocketTransport({
    host: "127.0.0.1",
    port: 12_345,
    timeout: 10_000,
  });
  return new VarlinkClient(new VarlinkClientSideTransport(transport));
}

test("connects to the reference server", async () => {
  const client = getClient();
  const info = await client.call("org.varlink.service.GetInfo", {});
  expect(info).toBeObject();
  expect(info.interfaces).toEqual([
    "org.varlink.service",
    "org.varlink.certification",
  ]);
});

test("exposes error details", async () => {
  const client = getClient();
  expect(async () => client.call("org.varlink.unknown", {})).toThrow(
    'org.varlink.service.InterfaceNotFound {"interface":"org.varlink"}'
  );
});

test("passes untyped reference tests", async () => {
  const client = getClient();
  const returnValueStart = await client.call(
    "org.varlink.certification.Start",
    {}
  );

  const returnValue01 = await client.call("org.varlink.certification.Test01", {
    client_id: returnValueStart.client_id,
  });

  const returnValue02 = await client.call("org.varlink.certification.Test02", {
    client_id: returnValueStart.client_id,
    bool: returnValue01.bool,
  });

  const returnValue03 = await client.call("org.varlink.certification.Test03", {
    client_id: returnValueStart.client_id,
    int: returnValue02.int,
  });

  const returnValue04 = await client.call("org.varlink.certification.Test04", {
    client_id: returnValueStart.client_id,
    float: returnValue03.float,
  });

  const returnValue05 = await client.call("org.varlink.certification.Test05", {
    client_id: returnValueStart.client_id,
    string: returnValue04.string,
  });

  const returnValue06 = await client.call("org.varlink.certification.Test06", {
    client_id: returnValueStart.client_id,
    bool: returnValue05.bool,
    int: returnValue05.int,
    float: returnValue05.float,
    string: returnValue05.string,
  });

  const returnValue07 = await client.call("org.varlink.certification.Test07", {
    client_id: returnValueStart.client_id,
    struct: returnValue06.struct,
  });

  const returnValue08 = await client.call("org.varlink.certification.Test08", {
    client_id: returnValueStart.client_id,
    map: returnValue07.map,
  });

  const returnValue09 = await client.call("org.varlink.certification.Test09", {
    client_id: returnValueStart.client_id,
    set: returnValue08.set,
  });

  const returnValue10: any[] = [];
  await client.callStream(
    "org.varlink.certification.Test10",
    {
      client_id: returnValueStart.client_id,
      mytype: returnValue09.mytype,
    },
    (error, data) => {
      expect(error).toBeUndefined();
      returnValue10.push(data);
    }
  );

  await client.callOneshot("org.varlink.certification.Test11", {
    client_id: returnValueStart.client_id,
    last_more_replies: returnValue10.map((x) => x.string as string),
  });

  const returnValueEnd = await client.call(
    "org.varlink.certification.End",
    returnValueStart
  );
  expect(returnValueEnd.all_ok).toBeTrue();
});
