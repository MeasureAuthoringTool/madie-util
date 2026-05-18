import useOktaTokens, { decodeJWT } from "./useOktaTokens";

const TEST_USER = "te$tuser@te$t.com";
const TEST_ACCESS_TOKEN =
  "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0ZSR0dXNlckB0ZSR0LmNvbSJ9.sig";
const idTokenObj = {
  authorizeUrl: "authorize.url",
  claims: {
    sub: TEST_USER,
    name: "Test User",
  },
  idToken: "test.id.jwt",
};

const accessTokenObj = {
  authorizeUrl: "authorize.url",
  accessToken: TEST_ACCESS_TOKEN,
};

const okta_token_storage = {
  idToken: idTokenObj,
  accessToken: accessTokenObj,
};

describe("useOktaTokens", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify(okta_token_storage)
    );
  });

  it("should return four functions", () => {
    const oktaTokens = useOktaTokens();
    expect(oktaTokens.getIdTokenObj).toBeTruthy();
    expect(oktaTokens.getIdToken).toBeTruthy();
    expect(oktaTokens.getAccessTokenObj).toBeTruthy();
    expect(oktaTokens.getAccessToken).toBeTruthy();
    expect(oktaTokens.getUserName).toBeTruthy();
  });

  it("should return an idToken object", () => {
    const { getIdTokenObj } = useOktaTokens();
    expect(getIdTokenObj()).toEqual(idTokenObj);
    expect(global.Storage.prototype.getItem).toHaveBeenCalledWith(
      "okta-token-storage"
    );
  });

  it("should return an idToken", () => {
    const { getIdToken } = useOktaTokens();
    expect(getIdToken()).toEqual("test.id.jwt");
    expect(global.Storage.prototype.getItem).toHaveBeenCalledWith(
      "okta-token-storage"
    );
  });

  it("should return an accessToken object", () => {
    const { getAccessTokenObj } = useOktaTokens();
    expect(getAccessTokenObj()).toEqual(accessTokenObj);
    expect(global.Storage.prototype.getItem).toHaveBeenCalledWith(
      "okta-token-storage"
    );
  });

  it("should return an accessToken", () => {
    const { getAccessToken } = useOktaTokens();
    expect(getAccessToken()).toEqual(TEST_ACCESS_TOKEN);
    expect(global.Storage.prototype.getItem).toHaveBeenCalledWith(
      "okta-token-storage"
    );
  });

  it("should return user name", () => {
    const { getUserName } = useOktaTokens();
    expect(getUserName()).toEqual(TEST_USER);
    expect(global.Storage.prototype.getItem).toHaveBeenCalledWith(
      "okta-token-storage"
    );
  });

  it("should gracefully handle a malformed item", () => {
    jest.resetAllMocks();
    global.Storage.prototype.getItem = jest.fn(() => "THIS IS NOT JSON!");
    const { getAccessTokenObj } = useOktaTokens();
    expect(getAccessTokenObj()).toBeFalsy();
  });

  it("should gracefully handle a null storage item", () => {
    jest.resetAllMocks();
    global.Storage.prototype.getItem = jest.fn(() => null);
    const { getAccessTokenObj } = useOktaTokens();
    expect(getAccessTokenObj()).toBeFalsy();
  });

  it("should gracefully handle an undefined storage item", () => {
    jest.resetAllMocks();
    global.Storage.prototype.getItem = jest.fn(() => undefined);
    const { getAccessTokenObj } = useOktaTokens();
    expect(getAccessTokenObj()).toBeFalsy();
  });

  it("should gracefully handle an missing item field", () => {
    jest.resetAllMocks();
    global.Storage.prototype.getItem = jest.fn(() => JSON.stringify({}));
    const { getAccessTokenObj } = useOktaTokens();
    expect(getAccessTokenObj()).toBeFalsy();
  });

  it("should use a provided storage key instead of the default", () => {
    const { getAccessTokenObj } = useOktaTokens("some-storage-key");
    expect(getAccessTokenObj()).toBeTruthy();
    expect(global.Storage.prototype.getItem).toHaveBeenCalledWith(
      "some-storage-key"
    );
  });

  describe("getUserName", () => {
    it("should return the sub claim from a valid access token JWT", () => {
      const { getUserName } = useOktaTokens();
      expect(getUserName()).toEqual(TEST_USER);
    });

    it("should return null when accessToken field is missing from storage", () => {
      global.Storage.prototype.getItem = jest.fn(() =>
        JSON.stringify({ idToken: idTokenObj })
      );
      const { getUserName } = useOktaTokens();
      expect(getUserName()).toBeNull();
    });

    it("should return null when accessToken is not a string", () => {
      global.Storage.prototype.getItem = jest.fn(() =>
        JSON.stringify({
          accessToken: { ...accessTokenObj, accessToken: 12345 },
        })
      );
      const { getUserName } = useOktaTokens();
      expect(getUserName()).toBeNull();
    });

    it("should return undefined when JWT has no sub claim", () => {
      // payload: {"role":"admin"} — no sub field
      const noSubToken =
        "eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.sig";
      global.Storage.prototype.getItem = jest.fn(() =>
        JSON.stringify({
          accessToken: { ...accessTokenObj, accessToken: noSubToken },
        })
      );
      const { getUserName } = useOktaTokens();
      expect(getUserName()).toBeNull();
    });

    it("should return null when the access token is malformed", () => {
      global.Storage.prototype.getItem = jest.fn(() =>
        JSON.stringify({
          accessToken: { ...accessTokenObj, accessToken: "not.a.jwt" },
        })
      );
      const { getUserName } = useOktaTokens();
      expect(getUserName()).toBeNull();
    });
  });
});

describe("decodeJWT", () => {
  it("should decode a valid JWT and return the payload", () => {
    const result = decodeJWT(TEST_ACCESS_TOKEN);
    expect(result).toEqual({ sub: TEST_USER });
  });

  it("should handle a JWT payload that requires base64 padding", () => {
    // payload: {"sub":"a"} — base64url length not divisible by 4
    const token = "eyJhbGciOiJub25lIn0.eyJzdWIiOiJhIn0.sig";
    const result = decodeJWT(token);
    expect(result).toEqual({ sub: "a" });
  });

  it("should correctly decode a JWT payload containing Unicode characters", () => {
    // payload: {"sub":"héllo"} — contains a multi-byte UTF-8 character
    const token = "eyJhbGciOiJub25lIn0.eyJzdWIiOiJow6lsbG8ifQ.sig";
    const result = decodeJWT(token);
    expect(result).toEqual({ sub: "héllo" });
  });

  it("should return null for a null input", () => {
    expect(decodeJWT(null as any)).toBeNull();
  });

  it("should return null for an undefined input", () => {
    expect(decodeJWT(undefined as any)).toBeNull();
  });

  it("should return null for a non-string input", () => {
    expect(decodeJWT(42 as any)).toBeNull();
  });

  it("should return null for an empty string", () => {
    expect(decodeJWT("")).toBeNull();
  });

  it("should return null for a token with only one segment (no payload)", () => {
    expect(decodeJWT("onlyone")).toBeNull();
  });

  it("should return null for a token with a corrupted base64 payload", () => {
    const token = "eyJhbGciOiJub25lIn0.!!!NOTBASE64!!$.sig";
    expect(decodeJWT(token)).toBeNull();
  });

  it("should return null for a token whose payload is not valid JSON", () => {
    // base64url of "not json" = bm90IGpzb24
    const token = "eyJhbGciOiJub25lIn0.bm90IGpzb24.sig";
    expect(decodeJWT(token)).toBeNull();
  });

  it("should return an object with multiple claims", () => {
    // payload: {"sub":"user@test.com","role":"admin","exp":9999999999}
    const payload = btoa(
      JSON.stringify({ sub: "user@test.com", role: "admin", exp: 9999999999 })
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const token = `eyJhbGciOiJub25lIn0.${payload}.sig`;
    const result = decodeJWT(token);
    expect(result).toEqual({
      sub: "user@test.com",
      role: "admin",
      exp: 9999999999,
    });
  });
});
