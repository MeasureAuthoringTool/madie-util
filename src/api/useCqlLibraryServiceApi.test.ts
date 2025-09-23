import axios from "./axios-instance";
import { CqlLibraryServiceApi } from "./useCqlLibraryServiceApi";

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
        `${mockBaseUrl}/cql-libraries/unlock`,
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
        `${mockBaseUrl}/cql-libraries/unlock`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    describe("useCqlLibraryServiceApi function", () => {
      it("should create and return CqlLibraryServiceApi instance with correct config", async () => {
        const useCqlLibraryServiceApi = (
          await import("./useCqlLibraryServiceApi")
        ).default;
        const api = await useCqlLibraryServiceApi();

        expect(api).toBeInstanceOf(CqlLibraryServiceApi);
        expect(api).toEqual(
          new CqlLibraryServiceApi("http://localhost/api", expect.any(Function))
        );
      });

      it("should use correct baseUrl and getAccessToken from configs", async () => {
        const useCqlLibraryServiceApi = (
          await import("./useCqlLibraryServiceApi")
        ).default;
        const api = await useCqlLibraryServiceApi();

        // Test the api instance makes calls with correct config
        const mockedResponse = "test response";
        mockedAxios.delete.mockResolvedValueOnce({ data: mockedResponse });

        await api.unlockLibraries();

        expect(mockedAxios.delete).toHaveBeenCalledWith(
          "http://localhost/api/cql-libraries/unlock",
          {
            headers: {
              Authorization: "Bearer mocked-token",
            },
          }
        );
      });
    });
  });
});
