import useCheckExternalLibrary from "./useCheckExternalLibrary";
import { LibraryListDTO } from "@madie/madie-models";

describe("useCheckExternalLibrary", () => {
  it("returns false when no libraries are provided", () => {
    expect(useCheckExternalLibrary([])).toBe(false);
    expect(
      useCheckExternalLibrary(undefined as unknown as LibraryListDTO[])
    ).toBe(false);
  });

  it("returns false when no selected library is external", () => {
    const libraries = [
      { id: "lib-1", externalLibrary: false },
      { id: "lib-2", externalLibrary: false },
    ] as LibraryListDTO[];

    expect(useCheckExternalLibrary(libraries)).toBe(false);
  });

  it("returns true when at least one selected library is external", () => {
    const libraries = [
      { id: "lib-1", externalLibrary: false },
      { id: "lib-2", externalLibrary: true },
    ] as LibraryListDTO[];

    expect(useCheckExternalLibrary(libraries)).toBe(true);
  });
});
