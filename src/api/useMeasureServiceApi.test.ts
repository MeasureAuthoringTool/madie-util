import axios from "./axios-instance";
import { MeasureServiceApi } from "./useMeasureServiceApi";

jest.mock("./axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("MeasureServiceApi", () => {
  let measureServiceApi: MeasureServiceApi;
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
  });
});
