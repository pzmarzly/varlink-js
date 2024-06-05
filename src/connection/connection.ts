export interface VarlinkConnectionProtocol {
  open(): Promise<VarlinkConnection>;
}

export interface VarlinkConnection {
  send(request: Buffer): Promise<void>;
  recv(): Promise<Buffer>;
  close(): Promise<void>;
}
