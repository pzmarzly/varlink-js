/* eslint "@typescript-eslint/no-unsafe-assignment": "off" */
/* eslint "@typescript-eslint/naming-convention": "off" */

import {test, expect} from 'bun:test';
import {SocketConnectionProtocol} from '../connection/node-socket';
import {VarlinkClient} from './client';

function getClient(): VarlinkClient {
  const proto = new SocketConnectionProtocol({
    host: '127.0.0.1',
    port: 12_345,
    timeout: 10_000,
  });
  return new VarlinkClient(proto);
}

test('connects to the reference server', async () => {
  const client = getClient();
  const info = await client.call('org.varlink.service.GetInfo', {});
  expect(info).toBeObject();
  expect(info.interfaces).toEqual([
    'org.varlink.service',
    'org.varlink.certification',
  ]);
});

test('exposes error details', async () => {
  const client = getClient();
  expect(async () => client.call('org.varlink.unknown', {})).toThrow(
    'org.varlink.service.InterfaceNotFound {"interface":"org.varlink"}',
  );
});

test('passes reference tests', async () => {
  const client = getClient();
  const returnValueStart = await client.call(
    'org.varlink.certification.Start',
    {},
  );
  console.log(returnValueStart);

  const returnValue01 = await client.call('org.varlink.certification.Test01', {
    client_id: returnValueStart.client_id,
  });
  console.log(returnValue01);

  const returnValue02 = await client.call('org.varlink.certification.Test02', {
    client_id: returnValueStart.client_id,
    bool: returnValue01.bool,
  });
  console.log(returnValue02);

  const returnValue03 = await client.call('org.varlink.certification.Test03', {
    client_id: returnValueStart.client_id,
    int: returnValue02.int,
  });
  console.log(returnValue03);

  const returnValue04 = await client.call('org.varlink.certification.Test04', {
    client_id: returnValueStart.client_id,
    float: returnValue03.float,
  });
  console.log(returnValue04);

  const returnValue05 = await client.call('org.varlink.certification.Test05', {
    client_id: returnValueStart.client_id,
    string: returnValue04.string,
  });
  console.log(returnValue05);

  const returnValue06 = await client.call('org.varlink.certification.Test06', {
    client_id: returnValueStart.client_id,
    bool: returnValue05.bool,
    int: returnValue05.int,
    float: returnValue05.float,
    string: returnValue05.string,
  });
  console.log(returnValue06);

  const returnValue07 = await client.call('org.varlink.certification.Test07', {
    client_id: returnValueStart.client_id,
    struct: returnValue06.struct,
  });
  console.log(returnValue07);

  const returnValue08 = await client.call('org.varlink.certification.Test08', {
    client_id: returnValueStart.client_id,
    map: returnValue07.map,
  });
  console.log(returnValue08);

  const returnValue09 = await client.call('org.varlink.certification.Test09', {
    client_id: returnValueStart.client_id,
    set: returnValue08.set,
  });
  console.log(returnValue09);

  const returnValue10: any[] = [];
  await client.callStream(
    'org.varlink.certification.Test10',
    {
      client_id: returnValueStart.client_id,
      mytype: returnValue09.mytype,
    },
    (error, data) => {
      expect(error).toBeUndefined();
      returnValue10.push(data);
    },
  );
  console.log(returnValue10);

  await client.callOneshot('org.varlink.certification.Test11', {
    client_id: returnValueStart.client_id,
    last_more_replies: returnValue10.map(x => x.string as string),
  });

  const returnValueEnd = await client.call(
    'org.varlink.certification.End',
    returnValueStart,
  );
  console.log(returnValueEnd);

  expect(returnValueEnd.all_ok).toBeTrue();
});
