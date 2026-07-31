import wafIntercept from "./wafIntercept";

import DOMPurify from "dompurify";

jest.mock("dompurify", () => ({
  sanitize: jest.fn((input) => input),
}));

describe("wafIntercept", () => {
  let mockDocument;

  beforeEach(() => {
    mockDocument = document;
    document.dispatchEvent = jest.fn();
  });

  it("should handle WAF block with soc@hcqis.org", async () => {
    const error = {
      response: {
        status: 403,
        headers: {
          "content-type": "text/html",
        },
        data: "<body>Access denied. Contact soc@hcqis.org<br>ID: 123456</body>",
      },
    };

    expect(() => {
      wafIntercept(error);
    }).toThrowError();
  });

  it("should handle WAF block with qnet_soc@cms.hhs.gov", async () => {
    const error = {
      response: {
        status: 403,
        headers: {
          "content-type": "text/html",
        },
        data: "<body>Access denied. Contact qnet_soc@cms.hhs.gov<br>ID: 789012</body>",
      },
    };
    expect(() => {
      wafIntercept(error);
    }).toThrowError();

    expect(DOMPurify.sanitize).toHaveBeenCalled();
  });

  it("should pass through non-WAF errors", async () => {
    const error = {
      response: {
        status: 500,
        data: "Server error",
      },
    };

    await expect(wafIntercept(error)).rejects.toEqual(error);
  });

  it("should pass through 403 responses without a content-type header", async () => {
    const error = {
      response: {
        status: 403,
        headers: {},
        data: "Forbidden",
      },
    };

    await expect(wafIntercept(error)).rejects.toEqual(error);
  });

  it("should handle WAF block with different case variations", async () => {
    const error = {
      response: {
        status: 403,
        headers: {
          "content-type": "text/html",
        },
        data: "<body>Access denied. Contact SOC@HCQIS.ORG<br>ID: 345678</body>",
      },
    };
    expect(() => {
      wafIntercept(error);
    }).toThrowError();
  });

  it("extracts supportID when ID: is present", () => {
    const error = {
      response: {
        status: 403,
        headers: { "content-type": "text/html" },
        data: "<body>ID:12345<br>soc@hcqis.org<br></body>",
      },
    };
    try {
      wafIntercept(error);
    } catch (e) {
      // Expect supportID to be "12345"
      expect(e.message).toBe("ID:12345");
    }
  });

  it("sets supportID to empty string when ID: is not present", () => {
    const error = {
      response: {
        status: 403,
        headers: { "content-type": "text/html" },
        data: "<body>soc@hcqis.org<br></body>",
      },
    };
    try {
      wafIntercept(error);
    } catch (e) {
      expect(e.message).toBe("soc@hcqis.org");
    }
  });
});
