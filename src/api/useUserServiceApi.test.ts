import useUserServiceApi, { UserServiceApi } from "./useUserServiceApi";
import axios from "../api/axios-instance";
import { renderHook } from "@testing-library/react-hooks";

jest.mock("../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("./useServiceConfig", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    userService: { baseUrl: "test.url" },
  })),
}));

jest.mock("../hooks/useOktaTokens", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
}));

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

  it("returns measure owner details by calling getOwnerDetails", async () => {
    const ownerDetails = {
      harpId: "def456",
      firstName: "Measure",
      lastName: "Owner",
    };
    const resp = { status: 200, data: ownerDetails };
    mockedAxios.get.mockResolvedValue(resp);

    const result = await userServiceApi.getMeasureOwnerDetails("def456");
    expect(mockedAxios.get).toBeCalledWith("test.url/users/def456/details", {
      headers: {
        Authorization: "Bearer test.jwt",
      },
    });
    expect(result).toEqual(ownerDetails);
  });

  it("returns bulk user details for multiple harpIds", async () => {
    const bulkUserDetails = {
      abc123: {
        harpId: "abc123",
        firstName: "User",
        lastName: "One",
      },
      def456: {
        harpId: "def456",
        firstName: "User",
        lastName: "Two",
      },
    };
    const resp = { status: 200, data: bulkUserDetails };
    mockedAxios.post.mockResolvedValue(resp);

    const result = await userServiceApi.getBulkUserDetails([
      "abc123",
      "def456",
    ]);
    expect(mockedAxios.post).toBeCalledWith(
      "test.url/users/details",
      { harpIds: ["abc123", "def456"] },
      {
        headers: {
          Authorization: "Bearer test.jwt",
        },
      }
    );
    expect(result).toEqual(bulkUserDetails);
  });

  it("throws an error when unable to retrieve bulk user details", async () => {
    mockedAxios.post.mockRejectedValue(new Error("Network error"));
    await expect(
      userServiceApi.getBulkUserDetails(["badid1", "badid2"])
    ).rejects.toThrow(
      "Unable to retrieve bulk user details, please try later."
    );
  });
});

describe("useUserServiceApi hook", () => {
  it("returns UserServiceApi instance with correct configuration", () => {
    const { result } = renderHook(() => useUserServiceApi());

    expect(result.current).toBeInstanceOf(UserServiceApi);
  });
});
