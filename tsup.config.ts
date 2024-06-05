import {defineConfig} from 'tsup';

export default defineConfig({
  entry: [
    'src/client/client.ts',
    'src/protocol/protocol.ts',
    'src/connection/connection.ts',
    'src/connection/node-socket.ts',
  ],
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  target: 'es2017',
});
