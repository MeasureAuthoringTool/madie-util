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

  describe("getAllOrganizations", () => {
    it("should fetch and return organizations successfully", async () => {
      const mockOrganizations = [
        { id: "1", name: "Org 1" },
        { id: "2", name: "Org 2" },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockOrganizations });

      const result = await measureServiceApi.getAllOrganizations();

      expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/organizations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      expect(result).toEqual(mockOrganizations);
    });

    it("should throw error when no organizations are returned", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      await expect(measureServiceApi.getAllOrganizations()).rejects.toThrow(
        "Unable to fetch organizations"
      );
    });

    it("should throw error when API call fails", async () => {
      const error = new Error("API Error");
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(measureServiceApi.getAllOrganizations()).rejects.toThrow(
        "Unable to fetch organizations"
      );
    });

    describe("fetchMeasure", () => {
      it("should fetch and return measure successfully", async () => {
        const mockMeasure = { id: "123", name: "Test Measure" };
        mockedAxios.get.mockResolvedValueOnce({ data: mockMeasure });

        const result = await measureServiceApi.fetchMeasure("123");

        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${baseUrl}/measures/123`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        expect(result).toEqual(mockMeasure);
      });

      it("should throw error when API call fails", async () => {
        const error = new Error("API Error");
        mockedAxios.get.mockRejectedValueOnce(error);

        await expect(measureServiceApi.fetchMeasure("123")).rejects.toThrow(
          "API Error"
        );

        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${baseUrl}/measures/123`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      });
    });
  });
});
