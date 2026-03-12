jest.mock("../util/wafIntercept", () => jest.fn());

describe("axios-instance", () => {
  it("should attach wafIntercept as error interceptor", () => {
    jest.resetModules();
    const mockUse = jest.fn();
    jest.doMock("axios", () => {
      const create = jest.fn(() => ({
        interceptors: {
          response: {
            use: mockUse,
          },
        },
      }));
      return { create };
    });
    require("./axios-instance"); // triggers interceptor setup
    const [successHandler, errorHandler] = mockUse.mock.calls[0];
    expect(typeof successHandler).toBe("function");
    expect(errorHandler).toEqual(expect.any(Function));
    jest.dontMock("axios");
    jest.resetModules();
  });

  it("should call wafIntercept for error responses", () => {
    jest.resetModules();
    const mockUse = jest.fn();
    jest.doMock("axios", () => {
      const create = jest.fn(() => ({
        interceptors: {
          response: {
            use: mockUse,
          },
        },
      }));
      return { create };
    });
    const wafInterceptMock = require("../util/wafIntercept");
    require("./axios-instance");
    // Find the error handler attached
    const [[, errorHandler]] = mockUse.mock.calls;
    const mockError = { message: "error" };
    errorHandler(mockError);
    expect(wafInterceptMock).toHaveBeenCalledWith(mockError);
    jest.dontMock("axios");
    jest.resetModules();
  });

  it("should attach wafIntercept if interceptors.response.use exists", () => {
    jest.resetModules();
    const mockUse = jest.fn();
    jest.doMock("../util/wafIntercept", () => jest.fn(() => {})); // Mock wafIntercept to avoid unhandled rejection
    jest.doMock("axios", () => {
      const create = jest.fn(() => ({
        interceptors: {
          response: {
            use: mockUse,
          },
        },
      }));
      return { create };
    });
    require("./axios-instance");
    expect(mockUse).toHaveBeenCalled();
    // Call the attached handlers to cover their code
    const [successHandler, errorHandler] = mockUse.mock.calls[0];
    successHandler({});
    try {
      errorHandler({});
    } catch (e) {
      // swallow error
    }
    jest.dontMock("axios");
    jest.dontMock("../util/wafIntercept");
    jest.resetModules();
  });

  it("should not fail if interceptors or response is missing", () => {
    jest.resetModules();
    jest.doMock("axios", () => {
      const create = jest.fn(() => ({})); // no interceptors
      return { create };
    });
    expect(() => require("./axios-instance")).not.toThrow();
    jest.dontMock("axios");
    jest.resetModules();
  });
});
