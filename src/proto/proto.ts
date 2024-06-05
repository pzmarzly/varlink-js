export type VarlinkDictionary = Record<string, any>;

export type VarlinkRequest = {
  method: string;
  parameters: VarlinkDictionary;
  oneway: boolean;
  more: boolean;
  upgrade: boolean;
};

export function serializeVarlinkRequest(request: VarlinkRequest): Buffer {
  let partial: Partial<VarlinkRequest> = { method: request.method };
  if (Object.keys(request.parameters).length > 0)
    partial.parameters = request.parameters;
  if (request.oneway) partial.oneway = request.oneway;
  if (request.more) partial.more = request.more;
  if (request.upgrade) partial.upgrade = request.upgrade;
  return Buffer.from(JSON.stringify(partial));
}

export function deserializeVarlinkRequest(buffer: Buffer): VarlinkRequest {
  let partial: VarlinkRequest = JSON.parse(buffer.toString());
  if (!partial.parameters) partial.parameters = {};
  if (!partial.oneway) partial.oneway = false;
  if (!partial.more) partial.more = false;
  if (!partial.upgrade) partial.upgrade = false;
  return partial;
}

export type VarlinkSuccessResponse = {
  error: undefined;
  parameters: VarlinkDictionary;
  continues: boolean;
};

export type VarlinkErrorResponse = {
  error: string;
  parameters: VarlinkDictionary;
  continues: undefined;
};

export type VarlinkResponse = VarlinkSuccessResponse | VarlinkErrorResponse;

export function serializeVarlinkResponse(response: VarlinkResponse): Buffer {
  let partial: Partial<VarlinkResponse> = { parameters: response.parameters };
  if (response.error !== undefined) partial.error = response.error;
  if (response.continues) partial.continues = response.continues;
  return Buffer.from(JSON.stringify(response));
}

export function deserializeVarlinkResponse(buffer: Buffer): VarlinkResponse {
  let partial: VarlinkResponse = JSON.parse(buffer.toString());
  if (!partial.error && !partial.continues) partial.continues = false;
  return partial;
}

export interface VarlinkProtocolClient {
  open(): Promise<VarlinkConnectionClient>;
}

export interface VarlinkConnection {
  send(request: Buffer): Promise<void>;
  recv(): Promise<Buffer>;
  close(): Promise<void>;
}

export class VarlinkConnectionClient {
  constructor(private conn: VarlinkConnection) {}

  async send(request: VarlinkRequest): Promise<void> {
    await this.conn.send(serializeVarlinkRequest(request));
  }

  async recv(): Promise<VarlinkResponse> {
    return deserializeVarlinkResponse(await this.conn.recv());
  }

  async close(): Promise<void> {
    await this.conn.close();
  }
}
