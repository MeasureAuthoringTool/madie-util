import {
  compareVersions,
  getLatestVersion,
  validateNewVersion,
  VERSION_FORMAT_ERROR,
  VERSION_LOWER_ERROR,
  VERSION_REQUIRED_ERROR,
} from "./versionUtils";

const DUPLICATE_ERROR =
  "New version # must not be one that has been used previously for this measure";

describe("compareVersions", () => {
  it("orders by major, then minor, then revision", () => {
    expect(compareVersions("2.0.000", "1.9.999")).toBeGreaterThan(0);
    expect(compareVersions("1.1.000", "1.2.000")).toBeLessThan(0);
    expect(compareVersions("1.0.002", "1.0.001")).toBeGreaterThan(0);
    expect(compareVersions("1.0.000", "1.0.000")).toBe(0);
  });

  it("treats missing segments and undefined versions as zero", () => {
    expect(compareVersions("1", "1.0.000")).toBe(0);
    expect(compareVersions(undefined, undefined)).toBe(0);
    expect(compareVersions("0.0.001", undefined)).toBeGreaterThan(0);
  });
});

describe("getLatestVersion", () => {
  it("returns the highest version in the list", () => {
    const items = [
      { id: "a", version: "1.0.000" },
      { id: "c", version: "1.2.000" },
      { id: "b", version: "1.1.000" },
    ];
    expect(getLatestVersion(items)?.id).toBe("c");
  });

  it("returns null for an empty or missing list", () => {
    expect(getLatestVersion([])).toBeNull();
    expect(getLatestVersion(undefined as any)).toBeNull();
  });
});

describe("validateNewVersion", () => {
  const selected = { id: "current", version: "3.2.003" };
  const setVersions = [
    { id: "older", version: "3.2.001" },
    { id: "previous", version: "3.2.002" },
    selected,
  ];

  const validate = (value: string, ...rest: any[]) =>
    rest.length
      ? validateNewVersion(value, rest[0], rest[1], DUPLICATE_ERROR)
      : validateNewVersion(value, selected, setVersions, DUPLICATE_ERROR);

  it("requires a value", () => {
    expect(validate("")).toBe(VERSION_REQUIRED_ERROR);
  });

  it.each([
    ["3.2.03", "too few revision digits"],
    ["3.2", "missing revision segment"],
    ["3.2.0031", "too many revision digits"],
    ["not a version", "non-numeric"],
    [" 3.2.002", "leading whitespace"],
  ])("rejects %s (%s)", (value) => {
    expect(validate(value)).toBe(VERSION_FORMAT_ERROR);
  });

  it("reports a format error when nothing is selected", () => {
    expect(validate("3.2.002", null, setVersions)).toBe(VERSION_FORMAT_ERROR);
  });

  it("rejects a version equal to or higher than the current one", () => {
    expect(validate("3.2.003")).toBe(VERSION_LOWER_ERROR);
    expect(validate("3.2.004")).toBe(VERSION_LOWER_ERROR);
    expect(validate("4.0.000")).toBe(VERSION_LOWER_ERROR);
  });

  it("rejects a version already used elsewhere in the set", () => {
    expect(validate("3.2.002")).toBe(DUPLICATE_ERROR);
  });

  it("does not treat the selected item's own version as a duplicate", () => {
    expect(
      validate("3.1.999", { id: "current", version: "3.2.003" }, [
        { id: "current", version: "3.1.999" },
      ])
    ).toBe("");
  });

  it("accepts a lower, unused, well-formed version", () => {
    expect(validate("3.1.999")).toBe("");
  });

  it("tolerates a missing set list", () => {
    expect(validate("3.1.999", selected, undefined)).toBe("");
  });
});
