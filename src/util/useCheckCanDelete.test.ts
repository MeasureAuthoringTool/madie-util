import * as React from "react";
import useOktaTokens from "../hooks/useOktaTokens";
import useCheckUserCanDelete from "./useCheckCanDelete";

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
    const canEdit = useCheckUserCanDelete(JANE_DOE, true);
    expect(canEdit).toBeTruthy();
  });

  it("should return true when user name and createdBy are the same", () => {
    const canEdit = useCheckUserCanDelete(JANE_DOE, true);
    expect(canEdit).toBeTruthy();
  });

  it("should return false when user name and createdBy are same but it is not draft", () => {
    const canEdit = useCheckUserCanDelete(JANE_DOE, false);
    expect(canEdit).not.toBeTruthy();
  });

  //   it("should return undefined when user name and createdBy are not the same", () => {
  //     const canEdit = useCheckUserCanEdit("anotherU$er", true);
  //     expect(canEdit).not.toBeTruthy();
  //   });

  //   it("should return true when measure is shared with the same user", () => {
  //     const canEdit = useCheckUserCanEdit(
  //       "anotherU$er", // nosec
  //       [{ userId: JANE_DOE, roles: ["SHARED_WITH"] }],
  //       true
  //     );
  //     expect(canEdit).toBeTruthy();
  //   });

  //   it("should return true when measure is shared with the same user with no version status supplied", () => {
  //     const canEdit = useCheckUserCanEdit("anotherU$er", [
  //       { userId: JANE_DOE, roles: ["SHARED_WITH"] },
  //     ]);
  //     expect(canEdit).toBeTruthy();
  //   });

  //   it("should return undefined when measure is shared with a different user", () => {
  //     const canEdit = useCheckUserCanEdit(
  //       "anotherU$er",
  //       [{ userId: JOHN_DOE, roles: ["SHARED_WITH"] }],
  //       true
  //     );
  //     expect(canEdit).not.toBeTruthy();
  //   });

  //   it("should return false when measure is versioned greater than 0", () => {
  //     const canEdit = useCheckUserCanEdit(
  //       "anotherU$er",
  //       [{ userId: JOHN_DOE, roles: ["SHARED_WITH"] }],
  //       false
  //     );
  //     expect(canEdit).not.toBeTruthy();
  //   });
});
