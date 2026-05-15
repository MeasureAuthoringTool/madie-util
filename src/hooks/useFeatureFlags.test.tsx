import { renderHook, act } from "@testing-library/react-hooks";
import { useFeatureFlags } from "./useFeatureFlags";
import { featureFlagsStore, FeatureFlags } from "../Store/featureFlagStore";

describe("useFeatureFlags", () => {
  beforeEach(() => {
    featureFlagsStore.updateFeatureFlags({
      qdmHideJson: true,
      enableQdmRepeatTransfer: false,
      qiCore7: false,
      QICoreCompositeMeasure: false,
    });
  });

  it("returns initial feature flags from store", () => {
    const { result } = renderHook(() => useFeatureFlags());
    expect(result.current).toEqual({
      qdmHideJson: true,
      enableQdmRepeatTransfer: false,
      qiCore7: false,
      QICoreCompositeMeasure: false,
    });
  });

  it("updates feature flags when store changes", () => {
    const { result } = renderHook(() => useFeatureFlags());
    act(() => {
      featureFlagsStore.updateFeatureFlags({
        qdmHideJson: false,
        enableQdmRepeatTransfer: true,
        qiCore7: true,
        QICoreCompositeMeasure: true,
      });
    });
    expect(result.current).toEqual({
      qdmHideJson: false,
      enableQdmRepeatTransfer: true,
      qiCore7: true,
      QICoreCompositeMeasure: true,
    });
  });

  it("unsubscribes on unmount", () => {
    const unsubscribeMock = jest.fn();
    // Use a real Subscription mock to match the expected type
    const { Subscription } = require("rxjs");
    const subscription = new Subscription();
    subscription.unsubscribe = unsubscribeMock;
    jest.spyOn(featureFlagsStore, "subscribe").mockReturnValue(subscription);
    const { unmount } = renderHook(() => useFeatureFlags());
    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
