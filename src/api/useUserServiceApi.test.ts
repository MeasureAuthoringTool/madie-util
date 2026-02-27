import { UserServiceApi } from "./useUserServiceApi";
jest.mock("../api/axios-instance", () => ({
  get: jest.fn(),
  put: jest.fn(),
}));
jest.mock("../Store/userRolesStore", () => ({
  userRolesStore: {
    updateUserRoles: jest.fn(),
  },
}));
const axios = require("../api/axios-instance");
const { userRolesStore } = require("../Store/userRolesStore");

describe("UserServiceApi", () => {
  let userServiceApi;
  beforeEach(() => {
    const getAccessToken = jest.fn(() => "test.jwt");
    userServiceApi = new (require("./useUserServiceApi").UserServiceApi)(
      "test.url",
      getAccessToken
    );
    axios.get.mockReset();
    axios.put.mockReset();
    userRolesStore.updateUserRoles.mockReset();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns owner details for a valid harpId", async () => {
    const ownerDetails = {
      harpId: "abc123",
      firstName: "Test",
      lastName: "Owner",
    };
    const resp = { status: 200, data: ownerDetails };
    axios.get.mockResolvedValue(resp);

    const result = await userServiceApi.getOwnerDetails("abc123");
    expect(axios.get).toBeCalledWith("test.url/users/abc123/details", {
      headers: {
        Authorization: "Bearer test.jwt",
      },
    });
    expect(result).toEqual(ownerDetails);
  });

  it("throws an error when unable to retrieve owner details", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));
    await expect(userServiceApi.getOwnerDetails("badid")).rejects.toThrow(
      "Unable to retrieve the owner, please try later."
    );
  });

  it("successfully logs in user with valid access token", async () => {
    const accessTokenObj = {
      claims: {
        sub: "testuser123",
      },
      accessToken: "valid.access.token",
    };
    const userLoginResponse = {
      id: "testuser123",
      status: "ACTIVE",
      loginDate: "2026-02-04T10:00:00Z",
    };
    const resp = { status: 200, data: userLoginResponse };
    axios.put.mockResolvedValue(resp);

    const result = await userServiceApi.loginUser(accessTokenObj);
    expect(axios.put).toBeCalledWith(
      "test.url/users/testuser123",
      {},
      {
        headers: {
          Authorization: "Bearer valid.access.token",
        },
      }
    );
    expect(result).toEqual(userLoginResponse);
  });

  it("throws an error when access token object is null", async () => {
    await expect(userServiceApi.loginUser(null)).rejects.toThrow(
      "No access token available for user login."
    );
  });

  it("throws an error when access token object has no claims", async () => {
    const accessTokenObj = {
      accessToken: "valid.access.token",
    };
    await expect(userServiceApi.loginUser(accessTokenObj)).rejects.toThrow(
      "No access token available for user login."
    );
  });

  it("throws an error when unable to login user", async () => {
    const accessTokenObj = {
      claims: {
        sub: "testuser123",
      },
      accessToken: "valid.access.token",
    };
    axios.put.mockRejectedValue(new Error("Network error"));
    await expect(userServiceApi.loginUser(accessTokenObj)).rejects.toThrow(
      "Unable to login user, please try later."
    );
  });

  it("loginUser updates userRolesStore with admin role", async () => {
    const accessTokenObj = {
      claims: { sub: "adminuser" },
      accessToken: "admin.token",
    };
    const response = {
      data: { roles: [{ role: "MADiE-Admin" }, { role: "OtherRole" }] },
    };
    axios.put.mockResolvedValue(response);
    const api = new (require("./useUserServiceApi").UserServiceApi)(
      "test.url",
      () => "admin.token"
    );
    const result = await api.loginUser(accessTokenObj);
    expect(userRolesStore.updateUserRoles).toHaveBeenCalledWith([
      "MADiE-Admin",
      "OtherRole",
    ]);
    expect(result).toEqual(response.data);
  });

  it("fetchUserRoles returns admin role when present", async () => {
    // Create a valid JWT token with sub
    const payload = { sub: "adminuser" };
    const token = ["header", btoa(JSON.stringify(payload)), "signature"].join(
      "."
    );
    const api = new (require("./useUserServiceApi").UserServiceApi)(
      "test.url",
      () => token
    );
    axios.get.mockResolvedValue({
      data: [{ role: "MADiE-Admin", roleType: "admin" }],
    });
    const result = await api.fetchUserRoles();
    expect(result).toEqual(["MADiE-Admin"]);
  });

  it("fetchUserRoles returns non-admin roles", async () => {
    const payload = { sub: "user123" };
    const token = ["header", btoa(JSON.stringify(payload)), "signature"].join(
      "."
    );
    const api = new (require("./useUserServiceApi").UserServiceApi)(
      "test.url",
      () => token
    );
    axios.get.mockResolvedValue({
      data: [{ role: "MADiE-User", roleType: "user" }],
    });
    const result = await api.fetchUserRoles();
    expect(result).toEqual(["MADiE-User"]);
  });

  it("fetchUserRoles returns empty array when axios.get throws", async () => {
    const payload = { sub: "user123" };
    const token = ["header", btoa(JSON.stringify(payload)), "signature"].join(
      "."
    );
    const api = new (require("./useUserServiceApi").UserServiceApi)(
      "test.url",
      () => token
    );
    axios.get.mockRejectedValue(new Error("network fail"));
    const result = await api.fetchUserRoles();
    expect(result).toEqual([]);
    expect(userRolesStore.updateUserRoles).not.toHaveBeenCalled();
  });

  it("fetchUserRoles returns empty array when token is invalid", async () => {
    const api = new (require("./useUserServiceApi").UserServiceApi)(
      "test.url",
      () => "invalidtoken"
    );
    const result = await api.fetchUserRoles();
    expect(result).toEqual([]);
    expect(userRolesStore.updateUserRoles).not.toHaveBeenCalled();
  });
});
