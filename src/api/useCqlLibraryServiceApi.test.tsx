import axios from "./axios-instance";
import { CqlLibraryServiceApi } from "./useCqlLibraryServiceApi";
import { OwnershipType } from "@madie/madie-models";

jest.mock("./axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "mocked-token",
}));

jest.mock("./useServiceConfig", () => () => ({
  cqlLibraryService: {
    baseUrl: "http://localhost/api",
  },
}));

describe("useCqlLibraryServiceApi", () => {
  const mockBaseUrl = "http://localhost/api";
  const mockToken = "mocked-token";
  const mockGetAccessToken = jest.fn().mockReturnValue(mockToken);

  const cqlLibraryService = new CqlLibraryServiceApi(
    mockBaseUrl,
    mockGetAccessToken
  );

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("unlockLibraries", () => {
    it("should unlock libraries successfully", async () => {
      const expectedResponse = "Libraries unlocked";
      mockedAxios.delete.mockResolvedValueOnce({ data: expectedResponse });

      const result = await cqlLibraryService.unlockLibraries();

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${mockBaseUrl}/libraries/unlock`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toBe(expectedResponse);
    });

    it("should throw error when unlock fails", async () => {
      const error = new Error("Failed to unlock libraries");
      mockedAxios.delete.mockRejectedValueOnce(error);

      await expect(cqlLibraryService.unlockLibraries()).rejects.toThrowError(
        error.message
      );

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${mockBaseUrl}/libraries/unlock`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });
  });
});
