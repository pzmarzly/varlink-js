import { VarlinkMethod } from "../protocol/protocol";

const GetInfo = new VarlinkMethod(
  "org.varlink.resolver.GetInfo",
  {} as object,
  {} as {
    interfaces: string[];
    vendor: string;
    product: string;
    version: string;
    url: string;
  },
);

const Resolve = new VarlinkMethod(
  "org.varlink.resolver.Resolve",
  {} as { interface: string },
  {} as { address: string },
);

export const OrgVarlinkResolver = {
  interface: "org.varlink.resolver",
  GetInfo,
  Resolve,
};
