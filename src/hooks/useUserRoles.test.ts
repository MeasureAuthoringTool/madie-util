import { renderHook, act } from "@testing-library/react-hooks";
import { useUserRoles } from "./useUserRoles";
import { userRolesStore } from "../Store/userRolesStore";

describe("useUserRoles", () => {
  beforeEach(() => {
    // Reset the store state before each test
    userRolesStore.updateUserRoles(null);
  });

  it("should return initial state when no roles are set", () => {
    const { result } = renderHook(() => useUserRoles());

    expect(result.current).toEqual({
      roles: [],
      isAdmin: false,
      isReviewer: false,
    });
  });

  it("should return updated state when roles change", () => {
    const { result } = renderHook(() => useUserRoles());

    act(() => {
      userRolesStore.updateUserRoles(["MADiE-Admin"]);
    });

    expect(result.current).toEqual({
      roles: ["MADiE-Admin"],
      isAdmin: true,
      isReviewer: false,
    });
  });

  it("should return isAdmin true when user has MADiE-Admin role", () => {
    const { result } = renderHook(() => useUserRoles());

    act(() => {
      userRolesStore.updateUserRoles(["MADiE-User", "MADiE-Admin"]);
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it("should return isAdmin false when user does not have MADiE-Admin role", () => {
    const { result } = renderHook(() => useUserRoles());

    act(() => {
      userRolesStore.updateUserRoles(["MADiE-User"]);
    });

    expect(result.current.isAdmin).toBe(false);
  });
});
