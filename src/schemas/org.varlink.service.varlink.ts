import { VarlinkMethod } from "../protocol/protocol";

const GetInfo = new VarlinkMethod(
  "org.varlink.service.GetInfo",
  {} as {},
  {} as {
    interfaces: string[];
    vendor: string;
    product: string;
    version: string;
    url: string;
  }
);

const GetInterfaceDescription = new VarlinkMethod(
  "org.varlink.service.GetInterfaceDescription",
  {} as { interface: string },
  {} as { description: string }
);

export const OrgVarlinkService = {
  interface: "org.varlink.service",
  GetInfo,
  GetInterfaceDescription,
};
