import * as React from "react";
import { waitFor } from "@testing-library/react";
import useTerminologyServiceApi, {
  TerminologyServiceApi,
  getServiceUrl,
} from "./useTerminologyServiceApi";
import { ServiceConfig } from "../Config/Config";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockConfig: ServiceConfig = {
  terminologyService: {
    baseUrl: "url",
  },
  measureService: {
    baseUrl: "",
  },
  elmTranslationService: {
    baseUrl: "",
  },
};

jest.mock("../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

jest.mock("../Config/Config", () => {
  return {
    getServiceConfig: jest.fn(() => Promise.resolve(mockConfig)),
  };
});

describe("useTerminologyServiceApi", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should retrieve the service url", async () => {
    const actual = await getServiceUrl();
    expect(actual).toBe("url");
  });

  it("useTerminologyServiceApi returns TerminologyServiceApi", () => {
    const actual: TerminologyServiceApi = useTerminologyServiceApi();
    expect(actual).toBeTruthy();
  });

  it("checkLogin to UMLS success", async () => {
    const resp = { status: 200, data: true };
    mockedAxios.get.mockResolvedValue(resp);
    const terminlogyService: TerminologyServiceApi = useTerminologyServiceApi();
    await terminlogyService.checkLogin();
    expect(mockedAxios.get).toBeCalledTimes(1);
  });

  it("checkLogin to UMLS failure", async () => {
    const resp = { status: 404, data: false, error: { message: "error" } };
    mockedAxios.get.mockRejectedValueOnce(resp);
    const terminlogyService: TerminologyServiceApi = useTerminologyServiceApi();
    try {
      const loggedIn = await terminlogyService.checkLogin();
      expect(mockedAxios.get).toBeCalledTimes(1);
      expect(loggedIn).toBeFalsy();
    } catch {}
  });

  it("checkLogin returns false if status is not 200", async () => {
    const resp = { status: 201, data: true };
    mockedAxios.get.mockResolvedValue(resp);
    const terminlogyService: TerminologyServiceApi = useTerminologyServiceApi();
    const loggedIn = await terminlogyService.checkLogin();
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(loggedIn).toBeFalsy();
  });

  it("Login to UMLS success", async () => {
    const resp = { status: 200, data: "success" };
    mockedAxios.post.mockResolvedValue(resp);
    const terminlogyService: TerminologyServiceApi = useTerminologyServiceApi();
    await terminlogyService.loginUMLS("test");
    expect(mockedAxios.post).toBeCalledTimes(1);
  });

  it("Login to UMLS failure", async () => {
    const resp = { status: 404, data: "failure", error: { message: "error" } };
    mockedAxios.post.mockRejectedValueOnce(resp);
    const terminlogyService: TerminologyServiceApi = useTerminologyServiceApi();
    try {
      await terminlogyService.loginUMLS("test");
      expect(mockedAxios.post).toBeCalledTimes(1);
    } catch {}
  });

  it("Login to UMLS will not be successful unless status is 200", async () => {
    const resp = { status: 201, data: "success" };
    mockedAxios.post.mockResolvedValue(resp);
    const terminlogyService: TerminologyServiceApi = useTerminologyServiceApi();
    const result = await terminlogyService.loginUMLS("test");
    expect(mockedAxios.post).toBeCalledTimes(1);
    expect(result).toContain("failure");
  });
});
