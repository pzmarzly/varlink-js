export type VarlinkDictionary = Record<string, any>;

export class VarlinkError extends Error {
  constructor(
    public type_: string,
    public parameters: VarlinkDictionary,
  ) {
    super(`${type_} ${JSON.stringify(parameters)}`);
    this.name = this.constructor.name;
  }
}

export class VarlinkMethod<
  Name extends string,
  Input extends VarlinkDictionary,
  Output extends VarlinkDictionary,
> {
  constructor(
    public name: Name,
    private readonly inputPhantom: Input,
    private readonly outputPhantom: Output,
  ) {}
}

export type VarlinkMethodGetName<M> =
  M extends VarlinkMethod<infer Name, any, any> ? Name : never;
export type VarlinkMethodGetInput<M> =
  M extends VarlinkMethod<any, infer Input, any> ? Input : never;
export type VarlinkMethodGetOutput<M> =
  M extends VarlinkMethod<any, any, infer Output> ? Output : never;

export class VarlinkDynamicMethod extends VarlinkMethod<
  string,
  VarlinkDictionary,
  VarlinkDictionary
> {
  constructor(name: string) {
    super(name, {}, {});
  }
}

export interface VarlinkRequest {
  method: string;
  parameters: VarlinkDictionary;
  oneway: boolean;
  more: boolean;
  upgrade: boolean;
}

export function serializeVarlinkRequest(request: VarlinkRequest): Uint8Array {
  const partial: Partial<VarlinkRequest> = { method: request.method };

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

export interface VarlinkSuccessResponse {
  error: undefined;
  parameters: VarlinkDictionary;
  continues: boolean;
}

export interface VarlinkErrorResponse {
  error: string;
  parameters: VarlinkDictionary;
  continues: undefined;
}

export type VarlinkResponse = VarlinkSuccessResponse | VarlinkErrorResponse;

export function serializeVarlinkResponse(
  response: VarlinkResponse,
): Uint8Array {
  const partial: Partial<VarlinkResponse> = { parameters: response.parameters };

  if (response.error !== undefined) {
    partial.error = response.error;
  }

  if (response.continues === true) {
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
  if (partial.error === undefined) {
    partial.continues ||= false;
  }

  return partial;
}
