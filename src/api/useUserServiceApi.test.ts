import { UserServiceApi } from "./useUserServiceApi";
import axios from "../api/axios-instance";

jest.mock("../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

describe("UserServiceApi", () => {
  let userServiceApi: UserServiceApi;
  beforeEach(() => {
    const getAccessToken = jest.fn(() => "test.jwt");
    userServiceApi = new UserServiceApi("test.url", getAccessToken);
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
    mockedAxios.get.mockResolvedValue(resp);

    const result = await userServiceApi.getOwnerDetails("abc123");
    expect(mockedAxios.get).toBeCalledWith("test.url/users/abc123/details", {
      headers: {
        Authorization: "Bearer test.jwt",
      },
    });
    expect(result).toEqual(ownerDetails);
  });

  it("throws an error when unable to retrieve owner details", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network error"));
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
    mockedAxios.put.mockResolvedValue(resp);

    const result = await userServiceApi.loginUser(accessTokenObj);
    expect(mockedAxios.put).toBeCalledWith(
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
    mockedAxios.put.mockRejectedValue(new Error("Network error"));
    await expect(userServiceApi.loginUser(accessTokenObj)).rejects.toThrow(
      "Unable to login user, please try later."
    );
  });
});
