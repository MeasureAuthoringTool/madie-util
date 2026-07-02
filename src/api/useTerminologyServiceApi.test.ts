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
      describe("getValueSet", () => {
        it("returns unauthorized ValueSet when not logged into UMLS", async () => {
          const result = await api.getValueSet(
            "1.2.3.4",
            "http://test.com",
            false
          );

          expect(result).toEqual({
            resourceType: "ValueSet",
            id: "1.2.3.4",
            url: "http://test.com",
            status: "unauthorized",
            errorMsg: "Please log in to UMLS",
          });

          expect(mockedAxios.get).not.toHaveBeenCalled();
        });

        it("returns valueset data when request succeeds", async () => {
          const valueSet = {
            resourceType: "ValueSet",
            id: "1.2.3.4",
            url: "http://test.com",
            status: "active",
            errorMsg: "",
          };

          mockedAxios.get.mockResolvedValueOnce({
            data: valueSet,
          });

          const result = await api.getValueSet(
            "1.2.3.4",
            "http://test.com",
            true
          );

          expect(mockedAxios.get).toHaveBeenCalledWith(
            `${baseUrl}/vsac/valueset`,
            expect.objectContaining({
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
                "Content-Type": "text/plain",
              },
              params: {
                oid: "1.2.3.4",
              },
              timeout: 15000,
            })
          );

          expect(result).toEqual(valueSet);
        });

        it("returns error ValueSet when request fails", async () => {
          mockedAxios.get.mockRejectedValueOnce({
            message: "Request failed",
            status: 500,
          });

          const result = await api.getValueSet(
            "1.2.3.4",
            "http://test.com",
            true
          );

          expect(result).toEqual({
            resourceType: "ValueSet",
            id: "1.2.3.4",
            url: "http://test.com",
            status: 500,
            errorMsg:
              "Request failed for oid = 1.2.3.4 location = http://test.com",
          });
        });
      });
      describe("validateCodes", () => {
        const codes = [
          {
            code: "123",
            codeSystem: {
              oid: "2.16.840",
            },
          },
        ];

        it("returns processed errors when not logged into UMLS", async () => {
          const result = await api.validateCodes(codes, false, "QI-Core");

          expect(result).toEqual([
            {
              code: "123",
              errorMessage: "Please Login to UMLS",
              valid: false,
              codeSystem: {
                oid: "2.16.840",
                errorMessage: "Please Login to UMLS",
                valid: false,
              },
            },
          ]);

          expect(mockedAxios.put).not.toHaveBeenCalled();
        });

        it("returns response data when validation succeeds", async () => {
          const responseData = [{ code: "123", valid: true }];

          mockedAxios.put.mockResolvedValueOnce({
            status: 200,
            data: responseData,
          });

          const result = await api.validateCodes(codes, true, "QI-Core");

          expect(mockedAxios.put).toHaveBeenCalledWith(
            `${baseUrl}/vsac/validations/codes?model=QI-Core`,
            codes,
            {
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
              },
            }
          );

          expect(result).toEqual(responseData);
        });

        it("returns processed errors when response status is not 200", async () => {
          mockedAxios.put.mockResolvedValueOnce({
            status: 500,
            data: [],
          });

          const result = await api.validateCodes(codes, true, "QI-Core");

          expect(result).toEqual([
            {
              code: "123",
              errorMessage: "Unable to validate code, Please contact HelpDesk",
              valid: false,
              codeSystem: {
                oid: "2.16.840",
                errorMessage:
                  "Unable to validate code, Please contact HelpDesk",
                valid: false,
              },
            },
          ]);
        });

        it("returns processed errors when axios throws", async () => {
          mockedAxios.put.mockRejectedValueOnce(new Error("fail"));

          const result = await api.validateCodes(codes, true, "QI-Core");

          expect(result).toEqual([
            {
              code: "123",
              errorMessage: "Unable to validate code, Please contact HelpDesk",
              valid: false,
              codeSystem: {
                oid: "2.16.840",
                errorMessage:
                  "Unable to validate code, Please contact HelpDesk",
                valid: false,
              },
            },
          ]);
        });
      });
      describe("searchValueSets", () => {
        it("returns search results when request succeeds", async () => {
          const searchValues = {
            oid: "1.2.3.4",
            name: "Test VS",
          };

          const responseData = {
            resultBundle: "bundle",
            valueSets: [
              {
                oid: "1.2.3.4",
                name: "Test VS",
              },
            ],
          };

          mockedAxios.get.mockResolvedValueOnce({
            data: responseData,
          });

          const result = await api.searchValueSets(searchValues);

          expect(mockedAxios.get).toHaveBeenCalledWith(
            `${baseUrl}/terminology/search-value-sets?oid=1.2.3.4&name=Test VS`,
            {
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
              },
            }
          );

          expect(result).toEqual(responseData);
        });

        it("returns undefined when axios throws", async () => {
          const consoleSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

          mockedAxios.get.mockRejectedValueOnce(new Error("fail"));

          const result = await api.searchValueSets({
            oid: "1.2.3.4",
          });

          expect(result).toBeUndefined();
          expect(consoleSpy).toHaveBeenCalled();

          consoleSpy.mockRestore();
        });
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
