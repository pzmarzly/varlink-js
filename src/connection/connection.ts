export type VarlinkConnectionProtocol = {
  open(): Promise<VarlinkConnection>;
};

export type VarlinkConnection = {
  send(request: Uint8Array): Promise<void>;
  recv(): Promise<Uint8Array>;
  close(): Promise<void>;
};
