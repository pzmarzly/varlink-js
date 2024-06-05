import type {VarlinkConnection} from '../connection/connection';

export type VarlinkDictionary = Record<string, any>;

export type VarlinkRequest = {
  method: string;
  parameters: VarlinkDictionary;
  oneway: boolean;
  more: boolean;
  upgrade: boolean;
};

export function serializeVarlinkRequest(request: VarlinkRequest): Uint8Array {
  const partial: Partial<VarlinkRequest> = {method: request.method};

  if (Object.keys(request.parameters).length > 0) {
    partial.parameters = request.parameters;
  }

  if (request.oneway) {
    partial.oneway = request.oneway;
  }

  if (request.more) {
    partial.more = request.more;
  }

  if (request.upgrade) {
    partial.upgrade = request.upgrade;
  }

  return new TextEncoder().encode(JSON.stringify(partial));
}

export function deserializeVarlinkRequest(buffer: Uint8Array): VarlinkRequest {
  const partial = JSON.parse(
    new TextDecoder().decode(buffer),
  ) as VarlinkRequest;
  partial.parameters ||= {};
  partial.oneway ||= false;
  partial.more ||= false;
  partial.upgrade ||= false;
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

export function serializeVarlinkResponse(
  response: VarlinkResponse,
): Uint8Array {
  const partial: Partial<VarlinkResponse> = {parameters: response.parameters};

  if (response.error !== undefined) {
    partial.error = response.error;
  }

  if (response.continues) {
    partial.continues = response.continues;
  }

  return new TextEncoder().encode(JSON.stringify(response));
}

export function deserializeVarlinkResponse(
  buffer: Uint8Array,
): VarlinkResponse {
  const partial = JSON.parse(
    new TextDecoder().decode(buffer),
  ) as VarlinkResponse;
  if (!partial.error) {
    partial.continues ||= false;
  }

  return partial;
}

export class VarlinkClientSideConnection {
  constructor(private readonly conn: VarlinkConnection) {}

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
