import * as React from "react";
import useOktaTokens from "../hooks/useOktaTokens";
import useCheckCanEditForLibrary from "./useCheckCanEditForLibrary";
import { CqlLibrary } from "@madie/madie-models/dist/CqlLibrary";

const TEST_USER = "te$tuser@te$t.com";

jest.mock("../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getUserName: jest.fn(),
  }))
);

const cql_library_same_createdBy = {
  id: "l1234",
  createdBy: "Te$tUser@te$t.com",
} as unknown as CqlLibrary;

const cql_library_different_createdBy = {
  id: "l1234",
  createdBy: "Te$tUser2@te$t.com",
} as unknown as CqlLibrary;

describe("Check user canEdit for CQL Library", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useOktaTokens as jest.Mock).mockImplementation(() => ({
      getUserName: () => TEST_USER,
    }));
  });

  it("should return true when user name and createdBy are the same", () => {
    const canEdit = useCheckCanEditForLibrary(cql_library_same_createdBy);
    expect(canEdit).toBeTruthy();
  });

  it("should return undefined when user name and createdBy are not the same", () => {
    const canEdit = useCheckCanEditForLibrary(cql_library_different_createdBy);
    expect(canEdit).toBeFalsy();
  });
});
