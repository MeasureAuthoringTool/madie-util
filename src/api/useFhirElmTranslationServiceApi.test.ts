import axios from "../api/axios-instance";
import useFhirElmTranslationServiceApi, {
  FhirElmTranslationServiceApi,
  RelevantElement,
} from "./useFhirElmTranslationServiceApi";
import useServiceConfig from "./useServiceConfig";
import useOktaTokens from "../hooks/useOktaTokens";

jest.mock("../api/axios-instance");
jest.mock("./useServiceConfig");
jest.mock("../hooks/useOktaTokens");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("FhirElmTranslationServiceApi", () => {
  const baseUrl = "http://test-base";
  const mockToken = "mock-token";

  const getAccessToken = jest.fn(() => mockToken);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("translateCqlToElm", () => {
    const cql = "library Test version '1.0.000'";

    it("returns parsed JSON when status is 200", async () => {
      mockedAxios.put.mockResolvedValueOnce({
        status: 200,
        data: { json: JSON.stringify({ elm: "data" }) },
      } as any);

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);
      const result = await api.translateCqlToElm(cql, true);

      expect(result).toEqual({ elm: "data" });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${baseUrl}/fhir/cql/translator/cql`,
        cql,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            "Content-Type": "text/plain",
          },
          params: {
            errorSeverity: "Info",
            annotations: true,
            locators: true,
            "disable-list-demotion": true,
            "disable-list-promotion": true,
            "validate-units": true,
            checkContext: true,
          },
        }
      );
    });

    it("returns undefined if status is not 200", async () => {
      mockedAxios.put.mockResolvedValueOnce({ status: 500, data: {} } as any);

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);

      expect(await api.translateCqlToElm(cql, false)).toBeUndefined();
    });

    it("throws error and logs warning on failure", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      mockedAxios.put.mockRejectedValueOnce({
        message: "fail message",
        response: { data: { error: "bad request", status: 400 } },
      });

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);

      await expect(api.translateCqlToElm(cql, true)).rejects.toThrow(
        "fail message"
      );
      expect(warnSpy).toHaveBeenCalledWith("bad request", 400);
      warnSpy.mockRestore();
    });

    it("throws error when baseUrl is missing", async () => {
      const api = new FhirElmTranslationServiceApi("" as any, getAccessToken);

      await expect(api.translateCqlToElm(cql, true)).rejects.toThrow(
        "Missing FHIR ELM translation service URL"
      );
    });
  });

  describe("fetchTranslatorVersion", () => {
    it("returns translator version on success", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: "1.0.0" });

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);
      const result = await api.fetchTranslatorVersion(true);

      expect(result).toBe("1.0.0");
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseUrl}/fhir/translator-version`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
          params: { draft: true },
        }
      );
    });

    it("throws error on failure", async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("network error");
      mockedAxios.get.mockRejectedValueOnce(error);

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);

      await expect(api.fetchTranslatorVersion(false)).rejects.toThrow();
      expect(errorSpy).toHaveBeenCalledWith(
        "unable to retrieve translator version:",
        error
      );
      errorSpy.mockRestore();
    });
  });

  describe("fetchRelevantDataElements", () => {
    const measure = { id: "measure-1" } as any;

    it("returns relevant elements on success and forwards the abort signal", async () => {
      const mockResponse: RelevantElement[] = [
        { type: "Observation", profile: "test-profile" },
      ];

      mockedAxios.put.mockResolvedValueOnce({ data: mockResponse });

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);
      const controller = new AbortController();

      const result = await api.fetchRelevantDataElements(
        measure,
        controller.signal
      );

      expect(result).toEqual(mockResponse);
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${baseUrl}/fhir/cql/relevant-elements`,
        measure,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );
    });

    it("returns empty array on failure", async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockedAxios.put.mockRejectedValueOnce(new Error("failure"));

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);
      const result = await api.fetchRelevantDataElements({} as any);

      expect(result).toEqual([]);
      expect(mockedAxios.put).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});

describe("useFhirElmTranslationServiceApi hook", () => {
  it("returns configured API instance", async () => {
    (useServiceConfig as jest.Mock).mockReturnValue({
      fhirElmTranslationService: {
        baseUrl: "http://hook-base",
      },
    });

    const mockGetToken = jest.fn(() => "hook-token");

    (useOktaTokens as jest.Mock).mockReturnValue({
      getAccessToken: mockGetToken,
    });

    const api = useFhirElmTranslationServiceApi();

    expect(api).toBeInstanceOf(FhirElmTranslationServiceApi);

    mockedAxios.get.mockResolvedValueOnce({ data: "2.0.0" });

    const result = await api.fetchTranslatorVersion(true);

    expect(result).toBe("2.0.0");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `http://hook-base/fhir/translator-version`,
      expect.objectContaining({
        headers: {
          Authorization: `Bearer hook-token`,
        },
      })
    );
  });
});
