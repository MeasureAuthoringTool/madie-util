import axios from "./axios-instance";

jest.mock("./axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("MeasureServiceApi", () => {
  const { MeasureServiceApi } = require("./useMeasureServiceApi");
  let measureServiceApi: typeof MeasureServiceApi;
  const baseUrl = "http://test.com";
  const accessToken = "test-token";
  const getAccessToken = () => accessToken;

  beforeEach(() => {
    measureServiceApi = new MeasureServiceApi(baseUrl, getAccessToken);
    jest.clearAllMocks();
  });

  describe("unlockMeasures", () => {
    it("should unlock measures successfully", async () => {
      const expectedResponse = "Measures unlocked";
      mockedAxios.delete.mockResolvedValueOnce({ data: expectedResponse });

      const result = await measureServiceApi.unlockMeasures();

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${baseUrl}/measures/unlock`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      expect(result).toBe(expectedResponse);
    });

    it("should throw error when unlock fails", async () => {
      const error = new Error("Failed to unlock measures");
      mockedAxios.delete.mockRejectedValueOnce(error);

      await expect(measureServiceApi.unlockMeasures()).rejects.toThrowError(
        error.message
      );

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${baseUrl}/measures/unlock`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    });

    describe("useMeasureServiceApi", () => {
      beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
      });

      it("should create MeasureServiceApi instance with correct config", async () => {
        const mockServiceConfig = {
          measureService: {
            baseUrl: "http://test.com",
          },
        };
        const mockGetAccessToken = jest.fn();

        jest.mock("./useServiceConfig", () => ({
          __esModule: true,
          default: jest.fn().mockResolvedValue(mockServiceConfig),
        }));

        jest.mock("../hooks/useOktaTokens", () => ({
          __esModule: true,
          default: jest
            .fn()
            .mockReturnValue({ getAccessToken: mockGetAccessToken }),
        }));

        const { default: useMeasureServiceApi, MeasureServiceApi: ApiClass } =
          await import("./useMeasureServiceApi");
        const api = await useMeasureServiceApi();

        expect(api).toBeInstanceOf(ApiClass);
        expect(api).toEqual(
          new MeasureServiceApi(
            mockServiceConfig.measureService.baseUrl,
            mockGetAccessToken
          )
        );
      });
    });
  });
});
