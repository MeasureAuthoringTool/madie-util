import { renderHook, act } from "@testing-library/react-hooks";
import useOwnerName, { getUserDisplayName } from "./useOwnerName";
import useUserServiceApi from "../api/useUserServiceApi";

jest.mock("../api/useUserServiceApi");

const getOwnerDetails = jest.fn();
(useUserServiceApi as jest.Mock).mockImplementation(() => ({
  getOwnerDetails,
}));

describe("getUserDisplayName", () => {
  it("joins first and last name", () => {
    expect(
      getUserDisplayName({ firstName: "John", lastName: "Doe" }, "harp1")
    ).toEqual("John Doe");
  });

  it("trims and ignores blank name parts", () => {
    expect(
      getUserDisplayName({ firstName: "  John  ", lastName: "  " }, "harp1")
    ).toEqual("John");
  });

  it("falls back to the provided value when no name is present", () => {
    expect(getUserDisplayName({ harpId: "harp1" }, "harp1")).toEqual("harp1");
    expect(getUserDisplayName({}, "harp1")).toEqual("harp1");
    expect(getUserDisplayName(undefined, "harp1")).toEqual("harp1");
  });
});

describe("useOwnerName", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the harpId while the lookup is pending", () => {
    getOwnerDetails.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useOwnerName("harp1"));
    expect(result.current).toEqual("harp1");
  });

  it("returns the owner's display name once resolved", async () => {
    getOwnerDetails.mockResolvedValue({ firstName: "John", lastName: "Doe" });
    const { result, waitForNextUpdate } = renderHook(() =>
      useOwnerName("harp1")
    );
    await waitForNextUpdate();
    expect(getOwnerDetails).toHaveBeenCalledWith("harp1");
    expect(result.current).toEqual("John Doe");
  });

  it("falls back to the harpId when the user has no name", async () => {
    getOwnerDetails.mockResolvedValue({ harpId: "harp1" });
    const { result } = renderHook(() => useOwnerName("harp1"));
    // resolved value produces the same harpId, so flush promises rather than
    // waiting for a state change that never comes
    await act(async () => {});
    expect(getOwnerDetails).toHaveBeenCalledWith("harp1");
    expect(result.current).toEqual("harp1");
  });

  it("falls back to the harpId when the lookup fails", async () => {
    getOwnerDetails.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useOwnerName("harp1"));
    await act(async () => {});
    expect(result.current).toEqual("harp1");
  });

  it("does not call the service when no harpId is provided", () => {
    const { result } = renderHook(() => useOwnerName(""));
    expect(getOwnerDetails).not.toHaveBeenCalled();
    expect(result.current).toEqual("");
  });
});
