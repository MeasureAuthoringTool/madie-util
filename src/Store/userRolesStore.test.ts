import { userRolesStore, UserRoles } from "./userRolesStore";

describe("userRolesStore", () => {
  beforeEach(() => {
    // Reset the store state before each test
    userRolesStore.updateUserRoles(null);
  });

  it("should have initial state with empty roles and isAdmin false", () => {
    expect(userRolesStore.initialState).toEqual({
      roles: [],
      isAdmin: false,
    });
  });

  it("should update roles and set isAdmin to false for non-admin user", () => {
    const roles = ["MADiE-User"];
    userRolesStore.updateUserRoles(roles);

    expect(userRolesStore.getState()).toEqual({
      roles: ["MADiE-User"],
      isAdmin: false,
    });
  });

  it("should update roles and set isAdmin to true for admin user", () => {
    const roles = ["MADiE-User", "MADiE-Admin"];
    userRolesStore.updateUserRoles(roles);

    expect(userRolesStore.getState()).toEqual({
      roles: ["MADiE-User", "MADiE-Admin"],
      isAdmin: true,
    });
  });

  it("should handle null roles by setting empty array", () => {
    userRolesStore.updateUserRoles(null);

    expect(userRolesStore.getState()).toEqual({
      roles: [],
      isAdmin: false,
    });
  });

  it("should notify subscribers when roles are updated", (done) => {
    const mockSetUserRoles = jest.fn();
    const subscription = userRolesStore.subscribe(mockSetUserRoles);

    userRolesStore.updateUserRoles(["MADiE-Admin"]);

    // Use setTimeout to allow the subscription to receive the update
    setTimeout(() => {
      expect(mockSetUserRoles).toHaveBeenCalledWith({
        roles: ["MADiE-Admin"],
        isAdmin: true,
      });
      subscription.unsubscribe();
      done();
    }, 0);
  });

  it("should correctly identify admin when MADiE-Admin is the only role", () => {
    userRolesStore.updateUserRoles(["MADiE-Admin"]);

    expect(userRolesStore.getState()?.isAdmin).toBe(true);
  });

  it("should not identify admin when MADiE-Admin is not present", () => {
    userRolesStore.updateUserRoles(["MADiE-User", "MADiE-Editor"]);

    expect(userRolesStore.getState()?.isAdmin).toBe(false);
  });

  it("should set isAdmin true when only MADiE-Admin role is present", () => {
    userRolesStore.updateUserRoles(["MADiE-Admin"]);
    const state = userRolesStore.getState();
    expect(state.roles).toEqual(["MADiE-Admin"]);
    expect(state.isAdmin).toBe(true);
  });

  it("should set isAdmin true when MADiE-Admin is among multiple roles", () => {
    userRolesStore.updateUserRoles(["Role1", "MADiE-Admin", "Role2"]);
    const state = userRolesStore.getState();
    expect(state.roles).toEqual(["Role1", "MADiE-Admin", "Role2"]);
    expect(state.isAdmin).toBe(true);
  });

  it("should set isAdmin false when MADiE-Admin is not present", () => {
    userRolesStore.updateUserRoles(["Role1", "Role2"]);
    const state = userRolesStore.getState();
    expect(state.roles).toEqual(["Role1", "Role2"]);
    expect(state.isAdmin).toBe(false);
  });

  it("should persist admin state to localStorage", () => {
    userRolesStore.updateUserRoles(["MADiE-Admin"]);
    const stored = JSON.parse(localStorage.getItem("madie-user-roles"));
    expect(stored.isAdmin).toBe(true);
  });
});
