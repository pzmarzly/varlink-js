import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/client/client.ts",
    "src/protocol/protocol.ts",
    "src/schemas/org.varlink.certification.varlink.ts",
    "src/schemas/org.varlink.service.varlink.ts",
    "src/transport/node-socket.ts",
    "src/transport/transport.ts",
  ],
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
  target: "es2017",
});
