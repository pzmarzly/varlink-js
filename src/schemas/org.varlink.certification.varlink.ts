import { VarlinkDynamicMethod } from "../protocol/protocol";

const Start = new VarlinkDynamicMethod("org.varlink.certification.Start");
const Test01 = new VarlinkDynamicMethod("org.varlink.certification.Test01");
const Test02 = new VarlinkDynamicMethod("org.varlink.certification.Test02");
const Test03 = new VarlinkDynamicMethod("org.varlink.certification.Test03");
const Test04 = new VarlinkDynamicMethod("org.varlink.certification.Test04");
const Test05 = new VarlinkDynamicMethod("org.varlink.certification.Test05");
const Test06 = new VarlinkDynamicMethod("org.varlink.certification.Test06");
const Test07 = new VarlinkDynamicMethod("org.varlink.certification.Test07");
const Test08 = new VarlinkDynamicMethod("org.varlink.certification.Test08");
const Test09 = new VarlinkDynamicMethod("org.varlink.certification.Test09");
const Test10 = new VarlinkDynamicMethod("org.varlink.certification.Test10");
const Test11 = new VarlinkDynamicMethod("org.varlink.certification.Test11");
const End = new VarlinkDynamicMethod("org.varlink.certification.End");

export const OrgVarlinkCertification = {
  interface: "org.varlink.certification",
  Start,
  Test01,
  Test02,
  Test03,
  Test04,
  Test05,
  Test06,
  Test07,
  Test08,
  Test09,
  Test10,
  Test11,
  End,
};
