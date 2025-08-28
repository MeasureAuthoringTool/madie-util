import * as React from "react";
import useOktaTokens from "../hooks/useOktaTokens";
import useCheckUserCanEdit from "./useCheckCanEdit";

const JANE_DOE = "Jane doe";
const JOHN_DOE = "john doe";

jest.mock("../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getUserName: jest.fn(),
  }))
);

describe("Check user canEdit", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useOktaTokens as jest.Mock).mockImplementation(() => ({
      getUserName: () => JANE_DOE,
    }));
  });

  it("should return true when user name and createdBy are the same", () => {
    const canEdit = useCheckUserCanEdit(JANE_DOE, [], true);
    expect(canEdit).toBeTruthy();
  });

  it("should return undefined when user name and createdBy are not the same", () => {
    const canEdit = useCheckUserCanEdit("anotherU$er", [], true);
    expect(canEdit).not.toBeTruthy();
  });

  it("should return true when measure is shared with the same user", () => {
    const canEdit = useCheckUserCanEdit(
      "anotherU$er", // nosec
      [{ userId: JANE_DOE, roles: ["SHARED_WITH"] }],
      true
    );
    expect(canEdit).toBeTruthy();
  });

  it("should return true when measure is shared with the same user with no version status supplied", () => {
    const canEdit = useCheckUserCanEdit("anotherU$er", [
      { userId: JANE_DOE, roles: ["SHARED_WITH"] },
    ]);
    expect(canEdit).toBeTruthy();
  });

  it("should return undefined when measure is shared with a different user", () => {
    const canEdit = useCheckUserCanEdit(
      "anotherU$er",
      [{ userId: JOHN_DOE, roles: ["SHARED_WITH"] }],
      true
    );
    expect(canEdit).not.toBeTruthy();
  });

  it("should return true when user is the owner, even for versioned measures", () => {
    const canEdit = useCheckUserCanEdit(
      JANE_DOE,
      [{ userId: JOHN_DOE, roles: ["SHARED_WITH"] }],
      false // versioned measure
    );
    expect(canEdit).toBeTruthy();
  });

  it("should return false when user is not the owner or shared user, even for versioned measures", () => {
    const canEdit = useCheckUserCanEdit(
      "anotherU$er",
      [{ userId: JOHN_DOE, roles: ["SHARED_WITH"] }],
      false // versioned measure
    );
    expect(canEdit).not.toBeTruthy();
  });
});
