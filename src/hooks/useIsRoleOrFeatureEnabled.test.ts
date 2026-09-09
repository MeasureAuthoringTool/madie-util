import * as featureFlagsModule from "./useFeatureFlags";
import { useIsRoleOrFeatureEnabled } from "./useIsRoleOrFeatureEnabled";
import { renderHook } from "@testing-library/react-hooks";

describe("useIsRoleOrFeatureEnabled", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when feature flag is enabled", () => {
    jest.spyOn(featureFlagsModule, "useFeatureFlags").mockReturnValue({
      QICoreCompositeMeasure: true,
      qdmHideJson: false,
      enableQdmRepeatTransfer: false,
      qiCore7: false,
    });

    let { result } = renderHook(() =>
      useIsRoleOrFeatureEnabled("QICoreCompositeMeasure")
    );
    expect(result.current).toBe(true);

    // Test with other feature flags
    result = renderHook(() => useIsRoleOrFeatureEnabled("qdmHideJson")).result;
    expect(result.current).toBe(false);

    result = renderHook(() =>
      useIsRoleOrFeatureEnabled("enableQdmRepeatTransfer")
    ).result;
    expect(result.current).toBe(false);

    result = renderHook(() => useIsRoleOrFeatureEnabled("qiCore7")).result;
    expect(result.current).toBe(false);
  });

  it("returns false with invalid feature flag", () => {
    jest
      .spyOn(featureFlagsModule, "useFeatureFlags")
      .mockReturnValue({ qiCore7: true });
    const { result } = renderHook(() =>
      useIsRoleOrFeatureEnabled("InvalidFeatureFlag")
    );
    expect(result.current).toBe(false);
  });
});
