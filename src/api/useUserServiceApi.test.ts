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
});
