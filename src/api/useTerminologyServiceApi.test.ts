import useTerminologyServiceApi, {
  TerminologyServiceApi,
} from "./useTerminologyServiceApi";
import { ServiceConfig, ServiceContext } from "./ServiceContext";
import axios from "../api/axios-instance";
import React from "react";
import { renderHook } from "@testing-library/react-hooks";

jest.mock("../api/axios-instance");
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

describe("useTerminologyServiceApi", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TerminologyServiceApi", () => {
    let api: TerminologyServiceApi;
    const baseUrl = "url";
    const getAccessToken = () => "test.jwt";

    beforeEach(() => {
      api = new TerminologyServiceApi(baseUrl, getAccessToken);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("checkLogin", () => {
      it("returns true when status is 200", async () => {
        mockedAxios.get.mockResolvedValueOnce({ status: 200 });
        const result = await api.checkLogin();
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${baseUrl}/vsac/umls-credentials/status`,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
              "Content-Type": "text/plain",
            },
            timeout: 15000,
          })
        );
        expect(result).toBe(true);
      });

      it("throws error when axios fails", async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error("fail"));
        await expect(api.checkLogin()).rejects.toThrow("fail");
      });

      it("returns false when status is not 200", async () => {
        mockedAxios.get.mockResolvedValueOnce({ status: 401 });
        const result = await api.checkLogin();
        expect(result).toBe(false);
      });
    });

    describe("loginUMLS", () => {
      it("returns status and response when status is 200", async () => {
        mockedAxios.post.mockResolvedValueOnce({ status: 200, data: "ok" });
        const result = await api.loginUMLS("api-key");
        expect(mockedAxios.post).toHaveBeenCalledWith(
          `${baseUrl}/vsac/umls-credentials`,
          "api-key",
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
              "Content-Type": "text/plain",
            },
            timeout: 15000,
          })
        );
        expect(result).toBe("status: 200 response: ok");
      });

      it("throws error when axios fails", async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error("fail"));
        await expect(api.loginUMLS("api-key")).rejects.toThrow("fail");
      });

      it("returns 'failure' when status is not 200", async () => {
        mockedAxios.post.mockResolvedValueOnce({ status: 401, data: "bad" });
        const result = await api.loginUMLS("api-key");
        expect(result).toBe("failure");
      });
    });

    describe("logoutUMLS", () => {
      it("returns true when status is 200", async () => {
        mockedAxios.delete.mockResolvedValueOnce({ status: 200 });
        const result = await api.logoutUMLS();
        expect(mockedAxios.delete).toHaveBeenCalledWith(
          `${baseUrl}/vsac/umls-credentials`,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
              "Content-Type": "text/plain",
            },
            timeout: 15000,
          })
        );
        expect(result).toBe(true);
      });

      it("throws error when axios fails", async () => {
        mockedAxios.delete.mockRejectedValueOnce(new Error("fail"));
        await expect(api.logoutUMLS()).rejects.toThrow("fail");
      });

      it("returns false when status is not 200", async () => {
        mockedAxios.delete.mockResolvedValueOnce({ status: 401 });
        const result = await api.logoutUMLS();
        expect(result).toBe(false);
      });
    });
  });
});

describe("function useTerminologyServiceApi()", () => {
  const wrapper = ({ children }) =>
    React.createElement(
      ServiceContext.Provider,
      { value: mockConfig },
      children
    );

  it("returns an instance of TerminologyServiceApi", () => {
    const { result } = renderHook(() => useTerminologyServiceApi(), {
      wrapper,
    });
    expect(result.current).toBeDefined();
    expect(result.current.baseUrl).toBe("url");
    expect(typeof result.current.getAccessToken).toBe("function");
    expect(result.current.getAccessToken()).toBe("test.jwt");
  });
});
