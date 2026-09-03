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

    describe("deleteValueSet", () => {
      it("calls delete value set endpoint and returns the response", async () => {
        const response = {
          status: 204,
        };

        mockedAxios.delete.mockResolvedValueOnce(response);

        const result = await api.deleteValueSet("vs-123");

        expect(mockedAxios.delete).toHaveBeenCalledWith(
          `${baseUrl}/terminology/admin/value-set/vs-123`,
          {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
          }
        );

        expect(result).toEqual(response);
      });
    });
    describe("addValueSet", () => {
      const validValueSet = {
        url: "http://example.org/fhir/ValueSet/test",
        version: "1.0.0",
        lastUpdated: "2026-08-13T16:54:04.022Z",
        manuallyModified: true,
        valueSet: '{"resourceType":"ValueSet"}',
      };

      it("posts the value set to the value-set endpoint and returns the data", async () => {
        const created = { id: "vs-1", ...validValueSet };
        (axios.post as jest.Mock).mockResolvedValueOnce({ data: created });

        const result = await api.addValueSet(validValueSet);

        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(axios.post).toHaveBeenCalledWith(
          "url/terminology/admin/value-set",
          validValueSet,
          {
            headers: { Authorization: "Bearer test.jwt" },
          }
        );
        expect(result).toEqual(created);
      });

      it("throws only the validationErrors['/api'] message when present", async () => {
        const apiMessage =
          "The URL in the expansion JSON [http://example.org/fhir/ValueSet/test-1] does not match the provided URL [http://example.org/fhir/ValueSet/test].";
        (axios.post as jest.Mock).mockRejectedValueOnce({
          response: {
            data: {
              message: "Some other generic message",
              validationErrors: {
                "/api": apiMessage,
              },
            },
          },
        });

        await expect(api.addValueSet(validValueSet)).rejects.toThrow(
          apiMessage
        );
      });

      it("appends the server message when there is no validationErrors['/api']", async () => {
        (axios.post as jest.Mock).mockRejectedValueOnce({
          response: { data: { message: "Value set already exists" } },
        });

        await expect(api.addValueSet(validValueSet)).rejects.toThrow(
          "An error occurred while adding the value set. Please try again. If the error persists, please contact the help desk.: Value set already exists"
        );
      });

      it("throws the generic message when the response has no message or validationErrors", async () => {
        (axios.post as jest.Mock).mockRejectedValueOnce({ response: {} });

        await expect(api.addValueSet(validValueSet)).rejects.toThrow(
          "An error occurred while adding the value set. Please try again. If the error persists, please contact the help desk."
        );
      });

      it("falls back to the generic message when there is no response", async () => {
        (axios.post as jest.Mock).mockRejectedValueOnce(
          new Error("Network down")
        );

        await expect(api.addValueSet(validValueSet)).rejects.toThrow(
          "An error occurred while adding the value set. Please try again. If the error persists, please contact the help desk."
        );
      });

      it("uses the latest access token on the request", async () => {
        const tokenFn = jest.fn().mockReturnValue("fresh-token");
        const service = new TerminologyServiceApi("http://test.url", tokenFn);
        (axios.post as jest.Mock).mockResolvedValueOnce({ data: {} });

        await service.addValueSet(validValueSet);

        expect(axios.post).toHaveBeenCalledWith(
          expect.any(String),
          validValueSet,
          expect.objectContaining({
            headers: { Authorization: "Bearer fresh-token" },
          })
        );
      });
    });

    describe("updateValueSet", () => {
      const validValueSet = {
        id: "vs-1",
        url: "http://example.org/fhir/ValueSet/test",
        version: "1.0.0",
        lastUpdated: "2026-08-13T16:54:04.022Z",
        manuallyModified: true,
        valueSet: '{"resourceType":"ValueSet"}',
      };

      it("puts the value set to the value-set endpoint and returns the data", async () => {
        const updated = { ...validValueSet };
        (axios.put as jest.Mock).mockResolvedValueOnce({ data: updated });

        const result = await api.updateValueSet(validValueSet);

        expect(axios.put).toHaveBeenCalledTimes(1);
        expect(axios.put).toHaveBeenCalledWith(
          "url/terminology/admin/value-set",
          validValueSet,
          {
            headers: { Authorization: "Bearer test.jwt" },
          }
        );
        expect(result).toEqual(updated);
      });

      it("throws only the validationErrors['/api'] message when present", async () => {
        const apiMessage = "The updated value set failed validation.";
        (axios.put as jest.Mock).mockRejectedValueOnce({
          response: {
            data: {
              message: "Some other generic message",
              validationErrors: {
                "/api": apiMessage,
              },
            },
          },
        });

        await expect(api.updateValueSet(validValueSet)).rejects.toThrow(
          apiMessage
        );
      });

      it("appends the server message when there is no validationErrors['/api']", async () => {
        (axios.put as jest.Mock).mockRejectedValueOnce({
          response: { data: { message: "Value set already exists" } },
        });

        await expect(api.updateValueSet(validValueSet)).rejects.toThrow(
          "An error occurred while updating the value set. Please try again. If the error persists, please contact the help desk.: Value set already exists"
        );
      });

      it("throws the generic message when the response has no message or validationErrors", async () => {
        (axios.put as jest.Mock).mockRejectedValueOnce({ response: {} });

        await expect(api.updateValueSet(validValueSet)).rejects.toThrow(
          "An error occurred while updating the value set. Please try again. If the error persists, please contact the help desk."
        );
      });

      it("falls back to the generic message when there is no response", async () => {
        (axios.put as jest.Mock).mockRejectedValueOnce(
          new Error("Network down")
        );

        await expect(api.updateValueSet(validValueSet)).rejects.toThrow(
          "An error occurred while updating the value set. Please try again. If the error persists, please contact the help desk."
        );
      });

      it("uses the latest access token on the request", async () => {
        const tokenFn = jest.fn().mockReturnValue("fresh-token");
        const service = new TerminologyServiceApi("http://test.url", tokenFn);
        (axios.put as jest.Mock).mockResolvedValueOnce({ data: {} });

        await service.updateValueSet(validValueSet);

        expect(axios.put).toHaveBeenCalledWith(
          expect.any(String),
          validValueSet,
          expect.objectContaining({
            headers: { Authorization: "Bearer fresh-token" },
          })
        );
      });
    });

    describe("getValueSets", () => {
      it("calls valuesets endpoint with default paging params", async () => {
        const responseData = {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          numberOfElements: 0,
        };

        (axios.get as jest.Mock).mockResolvedValueOnce({
          data: responseData,
        });

        const result = await api.getValueSets();

        expect(axios.get).toHaveBeenCalledWith(
          "url/terminology/admin/valuesets",
          {
            headers: {
              Authorization: "Bearer test.jwt",
            },
            params: {
              page: 0,
              limit: 10,
            },
          }
        );

        expect(result).toEqual(responseData);
      });

      it("calls valuesets endpoint with custom page and limit", async () => {
        (axios.get as jest.Mock).mockResolvedValueOnce({
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 2,
            size: 25,
            numberOfElements: 0,
          },
        });

        await api.getValueSets(2, 25);

        expect(axios.get).toHaveBeenCalledWith(
          "url/terminology/admin/valuesets",
          {
            headers: {
              Authorization: "Bearer test.jwt",
            },
            params: {
              page: 2,
              limit: 25,
            },
          }
        );
      });

      it("includes sortInfo when provided", async () => {
        (axios.get as jest.Mock).mockResolvedValueOnce({
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 10,
            numberOfElements: 0,
          },
        });

        await api.getValueSets(1, 20, "lastUpdated,true");

        expect(axios.get).toHaveBeenCalledWith(
          "url/terminology/admin/valuesets",
          {
            headers: {
              Authorization: "Bearer test.jwt",
            },
            params: {
              page: 1,
              limit: 20,
              sortInfo: "lastUpdated,true",
            },
          }
        );
      });

      it("includes sortInfo when provided, and searchTermSupplied", async () => {
        (axios.get as jest.Mock).mockResolvedValueOnce({
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 10,
            numberOfElements: 0,
          },
        });

        await api.getValueSets(1, 20, "lastUpdated,true", "test");

        expect(axios.get).toHaveBeenCalledWith(
          "url/terminology/admin/valuesets",
          {
            headers: {
              Authorization: "Bearer test.jwt",
            },
            params: {
              page: 1,
              searchTerm: "test",
              limit: 20,
              sortInfo: "lastUpdated,true",
            },
          }
        );
      });

      it("does not include sortInfo when not provided", async () => {
        (axios.get as jest.Mock).mockResolvedValueOnce({
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 10,
            numberOfElements: 0,
          },
        });

        await api.getValueSets(1, 20);

        expect(axios.get).toHaveBeenCalledWith(
          "url/terminology/admin/valuesets",
          {
            headers: {
              Authorization: "Bearer test.jwt",
            },
            params: {
              page: 1,
              limit: 20,
            },
          }
        );
      });

      it("returns the page data from the response", async () => {
        const responseData = {
          content: [
            {
              id: "vs-1",
              url: "http://example.com/valueset",
              lastUpdated: "2025-01-01T00:00:00Z",
              manuallyModified: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 10,
          numberOfElements: 1,
        };

        (axios.get as jest.Mock).mockResolvedValueOnce({
          data: responseData,
        });

        const result = await api.getValueSets();

        expect(result).toEqual(responseData);
        expect(result.content[0].id).toBe("vs-1");
      });

      it("uses the latest access token on each call", async () => {
        const tokenFn = jest
          .fn()
          .mockReturnValueOnce("token-1")
          .mockReturnValueOnce("token-2");

        const service = new TerminologyServiceApi("http://test.url", tokenFn);

        (axios.get as jest.Mock).mockResolvedValue({
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 10,
            numberOfElements: 0,
          },
        });

        await service.getValueSets();
        await service.getValueSets();

        expect(axios.get).toHaveBeenNthCalledWith(
          1,
          expect.any(String),
          expect.objectContaining({
            headers: {
              Authorization: "Bearer token-1",
            },
          })
        );

        expect(axios.get).toHaveBeenNthCalledWith(
          2,
          expect.any(String),
          expect.objectContaining({
            headers: {
              Authorization: "Bearer token-2",
            },
          })
        );
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
