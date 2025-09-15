import axios from "../api/axios-instance";
import { getOktaConfig, getServiceConfig } from "./Config";
import { OktaConfig } from "../api/ServiceContext";

jest.mock("../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("getOktaConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return valid OktaConfig when all required fields are present", async () => {
    const mockOktaEnvConfig = {
      baseUrl: "http://test.com",
      issuerUrl: "http://issuer.test.com",
      clientId: "test-client-id",
      scopes: ["openid"],
      useClassicEngine: true,
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockOktaEnvConfig });

    const result = await getOktaConfig();

    expect(mockedAxios.get).toHaveBeenCalledWith("/env-config/oktaConfig.json");
    expect(result).toEqual({
      baseUrl: mockOktaEnvConfig.baseUrl,
      issuer: mockOktaEnvConfig.issuerUrl,
      clientId: mockOktaEnvConfig.clientId,
      redirectUri: window.location.origin + "/login/callback",
      scopes: mockOktaEnvConfig.scopes,
      useClassicEngine: mockOktaEnvConfig.useClassicEngine,
    });
  });

  it("should throw error when required fields are missing", async () => {
    const mockOktaEnvConfig = {
      baseUrl: "",
      issuerUrl: "",
      clientId: "",
      scopes: [],
      useClassicEngine: false,
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockOktaEnvConfig });

    await expect(getOktaConfig()).rejects.toThrow(
      "Invalid oktaEnvConfig variables"
    );
  });

  it("should default useClassicEngine to false when not provided", async () => {
    const mockOktaEnvConfig = {
      baseUrl: "http://test.com",
      issuerUrl: "http://issuer.test.com",
      clientId: "test-client-id",
      scopes: ["openid"],
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockOktaEnvConfig });

    const result = await getOktaConfig();
    expect(result.useClassicEngine).toBe(false);
  });

  describe("getServiceConfig", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return valid ServiceConfig when all required fields are present", async () => {
      const mockServiceConfig = {
        measureService: {
          baseUrl: "http://test.com",
        },
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockServiceConfig });

      const result = await getServiceConfig();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/env-config/serviceConfig.json"
      );
      expect(result).toEqual(mockServiceConfig);
    });

    it("should throw error when measureService is missing", async () => {
      const mockServiceConfig = {};
      mockedAxios.get.mockResolvedValueOnce({ data: mockServiceConfig });

      await expect(getServiceConfig()).rejects.toThrow(
        "Invalid Service Config"
      );
    });

    it("should throw error when measureService.baseUrl is missing", async () => {
      const mockServiceConfig = {
        measureService: {},
      };
      mockedAxios.get.mockResolvedValueOnce({ data: mockServiceConfig });

      await expect(getServiceConfig()).rejects.toThrow(
        "Invalid Service Config"
      );
    });
  });
});
