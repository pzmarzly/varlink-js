import { test, expect } from "bun:test";
import { VarlinkClient } from "./client";
import { SocketConnectionProtocol } from "../connection/node_socket";

function getClient(): VarlinkClient {
  let proto = new SocketConnectionProtocol({
    host: "127.0.0.1",
    port: 12345,
    timeout: 10000,
  });
  return new VarlinkClient(proto);
}

test("connects to the reference server", async () => {
  let client = getClient();
  let info = await client.call("org.varlink.service.GetInfo", {});
  expect(info).toBeObject();
  expect(info.interfaces).toEqual([
    "org.varlink.service",
    "org.varlink.certification",
  ]);
});

test("exposes error details", async () => {
  let client = getClient();
  expect(async () => client.call("org.varlink.unknown", {})).toThrow(
    `org.varlink.service.InterfaceNotFound {"interface":"org.varlink"}`
  );
});

test("passes reference tests", async () => {
  let client = getClient();
  let retS = await client.call("org.varlink.certification.Start", {});
  console.log(retS);

  let ret01 = await client.call("org.varlink.certification.Test01", {
    client_id: retS.client_id,
  });
  console.log(ret01);

  let ret02 = await client.call("org.varlink.certification.Test02", {
    client_id: retS.client_id,
    bool: ret01.bool,
  });
  console.log(ret02);

  let ret03 = await client.call("org.varlink.certification.Test03", {
    client_id: retS.client_id,
    int: ret02.int,
  });
  console.log(ret03);

  let ret04 = await client.call("org.varlink.certification.Test04", {
    client_id: retS.client_id,
    float: ret03.float,
  });
  console.log(ret04);

  let ret05 = await client.call("org.varlink.certification.Test05", {
    client_id: retS.client_id,
    string: ret04.string,
  });
  console.log(ret05);

  let ret06 = await client.call("org.varlink.certification.Test06", {
    client_id: retS.client_id,
    bool: ret05.bool,
    int: ret05.int,
    float: ret05.float,
    string: ret05.string,
  });
  console.log(ret06);

  let ret07 = await client.call("org.varlink.certification.Test07", {
    client_id: retS.client_id,
    struct: ret06.struct,
  });
  console.log(ret07);

  let ret08 = await client.call("org.varlink.certification.Test08", {
    client_id: retS.client_id,
    map: ret07.map,
  });
  console.log(ret08);

  let ret09 = await client.call("org.varlink.certification.Test09", {
    client_id: retS.client_id,
    set: ret08.set,
  });
  console.log(ret09);

  let ret10: any[] = [];
  await client.callStream(
    "org.varlink.certification.Test10",
    {
      client_id: retS.client_id,
      mytype: ret09.mytype,
    },
    (err, data) => {
      expect(err).toBeNull();
      ret10.push(data);
    }
  );
  console.log(ret10);

  let ret11 = await client.callOneshot("org.varlink.certification.Test11", {
    client_id: retS.client_id,
    last_more_replies: ret10.map((x) => x.string),
  });
  console.log(ret11);

  let retE = await client.call("org.varlink.certification.End", retS);
  console.log(retE);

  expect(retE.all_ok).toBeTrue();
});
