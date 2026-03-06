import * as featureFlagsModule from "./useFeatureFlags";
import * as userRolesModule from "./useUserRoles";

describe("useIsAdminTransferEnabled", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when AdminTransferMeasure flag is enabled and user is admin", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminTransferMeasure: true });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: true });
    expect(
      require("./useIsAdminTransferEnabled").useIsAdminTransferEnabled()
    ).toBe(true);
  });

  it("returns false when AdminTransferMeasure flag is disabled", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminTransferMeasure: false });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: true });
    expect(
      require("./useIsAdminTransferEnabled").useIsAdminTransferEnabled()
    ).toBe(false);
  });

  it("returns false when user is not admin", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminTransferMeasure: true });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: false });
    expect(
      require("./useIsAdminTransferEnabled").useIsAdminTransferEnabled()
    ).toBe(false);
  });

  it("returns false when feature flag and user role are both missing", () => {
    jest.spyOn(featureFlagsModule, "useFeatureFlags").mockReturnValue({});
    jest.spyOn(userRolesModule, "useUserRoles").mockReturnValue({});
    expect(
      require("./useIsAdminTransferEnabled").useIsAdminTransferEnabled()
    ).toBe(false);
  });
});
