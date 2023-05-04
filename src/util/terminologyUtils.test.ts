import { getOidFromString } from "./terminologyUtils";

describe("getOidFromString", () => {
  it("Extracts oid from valid qdm oid string", () => {
    expect(
      getOidFromString("urn:oid:2.16.840.1.113762.1.4.1147.37", "QDM")
    ).toEqual("2.16.840.1.113762.1.4.1147.37");
  });

  it("Extracts oid from invalid qdm oid string", () => {
    expect(
      getOidFromString("fhir:2.16.840.1.113762.1.4.1147.37", "QDM")
    ).toBeUndefined();
  });

  it("Extracts oid from valid fhir oid string", () => {
    expect(
      getOidFromString("ValueSet/2.16.840.1.113762.1.4.1147.37", "FHIR")
    ).toEqual("2.16.840.1.113762.1.4.1147.37");
  });

  it("Extracts oid from invalid fhir oid string", () => {
    expect(
      getOidFromString("urn:oid:2.16.840.1.113762.1.4.1147.37", "FHIR")
    ).toBeUndefined();
  });
});
