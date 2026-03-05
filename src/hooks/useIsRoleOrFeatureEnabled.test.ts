import * as featureFlagsModule from "./useFeatureFlags";
import * as userRolesModule from "./useUserRoles";
import { useIsRoleOrFeatureEnabled } from "./useIsRoleOrFeatureEnabled";
import { renderHook } from "@testing-library/react-hooks";

describe("useIsRoleOrFeatureEnabled", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when feature flag is enabled", () => {
    jest.spyOn(featureFlagsModule, "useFeatureFlags").mockReturnValue({
      QICoreCompositeMeasure: true,
      qiCoreElementsTab: false,
      qdmHideJson: false,
      enableQdmRepeatTransfer: false,
      qiCore7: false,
      AdminTransferMeasures: false,
      AdminShareLibrary: false,
    });

    let { result } = renderHook(() =>
      useIsRoleOrFeatureEnabled("QICoreCompositeMeasure")
    );
    expect(result.current).toBe(true);

    // Test with other feature flags
    result = renderHook(() =>
      useIsRoleOrFeatureEnabled("qiCoreElementsTab")
    ).result;
    expect(result.current).toBe(false);

    result = renderHook(() => useIsRoleOrFeatureEnabled("qdmHideJson")).result;
    expect(result.current).toBe(false);

    result = renderHook(() =>
      useIsRoleOrFeatureEnabled("enableQdmRepeatTransfer")
    ).result;
    expect(result.current).toBe(false);

    result = renderHook(() => useIsRoleOrFeatureEnabled("qiCore7")).result;
    expect(result.current).toBe(false);
  });

  it("returns true when AdminTransferMeasures flag is enabled and user is admin", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminTransferMeasures: true });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: true });
    expect(useIsRoleOrFeatureEnabled("AdminTransferMeasures")).toBe(true);
  });

  it("returns false when AdminTransferMeasures flag is disabled", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminTransferMeasures: false });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: true });
    expect(useIsRoleOrFeatureEnabled("AdminTransferMeasures")).toBe(false);
  });

  it("returns false when user is not admin for AdminTransferMeasures", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminTransferMeasures: true });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: false });
    expect(useIsRoleOrFeatureEnabled("AdminTransferMeasures")).toBe(false);
  });

  it("returns false when feature flag and user role are both missing for AdminTransferMeasures", () => {
    jest.spyOn(featureFlagsModule, "useFeatureFlags").mockReturnValue({});
    jest.spyOn(userRolesModule, "useUserRoles").mockReturnValue({});
    expect(useIsRoleOrFeatureEnabled("AdminTransferMeasures")).toBe(false);
  });

  it("returns true when AdminShareLibrary flag is enabled and user is admin", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminShareLibrary: true });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: true });
    expect(useIsRoleOrFeatureEnabled("AdminShareLibrary")).toBe(true);
  });

  it("returns false when AdminShareLibrary flag is disabled", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminShareLibrary: false });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: true });
    expect(useIsRoleOrFeatureEnabled("AdminShareLibrary")).toBe(false);
  });

  it("returns false when user is not admin", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminShareLibrary: true });
    jest
      .spyOn(userRolesModule, "useUserRoles")
      .mockReturnValue({ isAdmin: false });
    expect(useIsRoleOrFeatureEnabled("AdminShareLibrary")).toBe(false);
  });

  it("returns false when feature flag and user role are both missing", () => {
    jest.spyOn(featureFlagsModule, "useFeatureFlags").mockReturnValue({});
    jest.spyOn(userRolesModule, "useUserRoles").mockReturnValue({});
    expect(useIsRoleOrFeatureEnabled("AdminShareLibrary")).toBe(false);
  });

  it("returns false with invalid feature flag", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ AdminShareLibrary: true });
    jest.spyOn(userRolesModule, "useUserRoles").mockReturnValue({});
    expect(useIsRoleOrFeatureEnabled("InvalidFeatureFlag")).toBe(false);
  });
});
