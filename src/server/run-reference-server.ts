#!/usr/bin/env bun run
import { ReferenceServer } from "./reference-server";

let port = 0;
if (process.env.PORT !== undefined) {
  port = Number(process.env.PORT);
}

const server = new ReferenceServer(port);
await server.start();
console.log(server.address());
