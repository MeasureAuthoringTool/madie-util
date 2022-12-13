import * as React from "react";
import useOktaTokens from "../hooks/useOktaTokens";
import useCheckUserCanEdit from "./useCheckCanEdit";

const TEST_USER = "te$tuser@te$t.com";

jest.mock("../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getUserName: jest.fn(),
  }))
);

describe("Check user canEdit", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useOktaTokens as jest.Mock).mockImplementation(() => ({
      getUserName: () => TEST_USER,
    }));
  });

  it("should return true when user name and createdBy are the same", () => {
    const canEdit = useCheckUserCanEdit(TEST_USER, []);
    expect(canEdit).toBeTruthy();
  });

  it("should return undefined when user name and createdBy are not the same", () => {
    const canEdit = useCheckUserCanEdit("anotherUser", []);
    expect(canEdit).not.toBeTruthy();
  });

  it("should return true when measure is shared with the same user", () => {
    const canEdit = useCheckUserCanEdit("anotherUser", [
      { userId: "Te$tUser@te$t.com", roles: ["SHARED_WITH"] },
    ]);
    expect(canEdit).toBeTruthy();
  });

  it("should return undefined when measure is shared with a different user", () => {
    const canEdit = useCheckUserCanEdit("anotherUser", [
      { userId: "Te$tUser3@te$t.com", roles: ["SHARED_WITH"] },
    ]);
    expect(canEdit).not.toBeTruthy();
  });
});
