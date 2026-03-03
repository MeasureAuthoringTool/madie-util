import { renderHook, act } from "@testing-library/react-hooks";
import { useFeatureFlags } from "./useFeatureFlags";

const initialFlags = { flagA: true, flagB: false };
const updatedFlags = { flagA: false, flagB: true };

let mockListeners: Array<(flags: any) => void> = [];
let mockStoreState = initialFlags;

jest.mock("../Store/featureFlagStore", () => ({
  featureFlagsStore: {
    get state() {
      return mockStoreState;
    },
    subscribe: (callbackFn: (flags: any) => void) => {
      mockListeners.push(callbackFn);
      return {
        unsubscribe: () => {
          mockListeners = mockListeners.filter(
            (listener) => listener !== callbackFn
          );
        },
      };
    },
  },
  FeatureFlags: {},
}));

describe("useFeatureFlags", () => {
  beforeEach(() => {
    mockStoreState = initialFlags;
    mockListeners = [];
  });

  it("returns initial feature flags from store", () => {
    const { result } = renderHook(() => useFeatureFlags());
    expect(result.current).toEqual(initialFlags);
  });

  it("updates feature flags when store changes", () => {
    const { result } = renderHook(() => useFeatureFlags());
    act(() => {
      mockStoreState = updatedFlags;
      mockListeners.forEach((callbackFn) => callbackFn(updatedFlags));
    });
    expect(result.current).toEqual(updatedFlags);
  });
});
