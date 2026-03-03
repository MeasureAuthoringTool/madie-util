import * as featureFlagsModule from "./useFeatureFlags";
import * as userRolesModule from "./useUserRoles";

describe("useIsAdminShareLibraryEnabled", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when AdminShareLibrary flag is enabled and user is admin", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminShareLibrary: true });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: true });
    expect(
      require("./useIsAdminShareLibraryEnabled").useIsAdminShareLibraryEnabled()
    ).toBe(true);
  });

  it("returns false when AdminShareLibrary flag is disabled", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminShareLibrary: false });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: true });
    expect(
      require("./useIsAdminShareLibraryEnabled").useIsAdminShareLibraryEnabled()
    ).toBe(false);
  });

  it("returns false when user is not admin", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminShareLibrary: true });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: false });
    expect(
      require("./useIsAdminShareLibraryEnabled").useIsAdminShareLibraryEnabled()
    ).toBe(false);
  });

  it("returns false when feature flag and user role are both missing", () => {
    jest.spyOn(featureFlagsModule, "useFeatureFlags").mockReturnValue({});
    jest.spyOn(userRolesModule, "useUserRoles").mockReturnValue({});
    expect(
      require("./useIsAdminShareLibraryEnabled").useIsAdminShareLibraryEnabled()
    ).toBe(false);
  });
});
