import axios from "../api/axios-instance";
import { FhirElmTranslationServiceApi } from "./useFhirElmTranslationServiceApi";
import { Measure } from "@madie/madie-models";

jest.mock("../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("FhirElmTranslationServiceApi", () => {
  let api: FhirElmTranslationServiceApi;
  const baseUrl = "http://test.com";
  const mockToken = "test-token";
  const getAccessToken = () => mockToken;

  beforeEach(() => {
    api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);
    jest.clearAllMocks();
  });

  describe("fetchTranslatorVersion", () => {
    it("should fetch translator version successfully", async () => {
      const expectedVersion = "1.0.0";
      mockedAxios.get.mockResolvedValueOnce({ data: expectedVersion });

      const result = await api.fetchTranslatorVersion(true);

      expect(result).toBe(expectedVersion);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseUrl}/fhir/translator-version`,
        {
          headers: { Authorization: `Bearer ${mockToken}` },
          params: { draft: true },
        }
      );
    });

    it("should throw error when fetch fails", async () => {
      const error = new Error("Network error");
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(api.fetchTranslatorVersion(false)).rejects.toThrow();
    });
  });

  describe("fetchRelevantDataElements", () => {
    it("should fetch relevant data elements successfully", async () => {
      const mockMeasure = {} as Measure;
      const expectedElements = [
        {
          oid: "test-oid",
          title: "Test Title",
          description: "Test Description",
          type: "Test Type",
          drc: "Test DRC",
          codeId: "test-code",
          name: "Test Name",
        },
      ];
      mockedAxios.put.mockResolvedValueOnce({ data: expectedElements });

      const result = await api.fetchRelevantDataElements(mockMeasure);

      expect(result).toEqual(expectedElements);
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${baseUrl}/fhir/cql/relevant-elements`,
        mockMeasure,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("should return empty array when fetch fails", async () => {
      const mockMeasure = {} as Measure;
      mockedAxios.put.mockRejectedValueOnce(new Error("Network error"));

      const result = await api.fetchRelevantDataElements(mockMeasure);

      expect(result).toEqual([]);
    });
  });
});
