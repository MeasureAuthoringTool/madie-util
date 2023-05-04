export const getOidFromString = (
  oidString: string,
  dataModel: string
): string => {
  if (dataModel === "QDM") {
    return oidString?.split("urn:oid:")[1];
  }
  return oidString?.split("ValueSet/")[1];
};
