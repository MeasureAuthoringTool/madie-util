import * as React from "react";
import useOktaTokens from "../hooks/useOktaTokens";
import checkUserCanEdit from "./useCheckCanEditForMeasure";
import { Measure } from "@madie/madie-models/dist/Measure";

const TEST_USER = "te$tuser@te$t.com";

jest.mock("../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getUserName: jest.fn(),
  }))
);

const measure_same_createdBy = {
  id: "m1234",
  createdBy: "Te$tUser@te$t.com",
} as unknown as Measure;

const measure_different_createdBy = {
  id: "m1234",
  createdBy: "Te$tUser2@te$t.com",
} as unknown as Measure;

const measure_different_createdBy_same_SharedWith = {
  id: "m1234",
  createdBy: "Te$tUser2@te$t.com",
  acls: [{ userId: "Te$tUser@te$t.com", roles: ["SHARED_WITH"] }], //#nosec
} as unknown as Measure;

const measure_different_createdBy_different_SharedWith = {
  id: "m1234",
  createdBy: "Te$tUser2@te$t.com",
  acls: [{ userId: "Te$tUser3@te$t.com", roles: ["SHARED_WITH"] }],
} as unknown as Measure;

describe("Check user canEdit", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useOktaTokens as jest.Mock).mockImplementation(() => ({
      getUserName: () => TEST_USER,
    }));
  });

  it("should return true when user name and createdBy are the same", () => {
    const canEdit = checkUserCanEdit(measure_same_createdBy);
    expect(canEdit).toBeTruthy();
  });

  it("should return undefined when user name and createdBy are not the same", () => {
    const canEdit = checkUserCanEdit(measure_different_createdBy);
    expect(canEdit).not.toBeTruthy();
  });

  it("should return true when measure is shared with the same user", () => {
    const canEdit = checkUserCanEdit(
      measure_different_createdBy_same_SharedWith
    );
    expect(canEdit).toBeTruthy();
  });

  it("should return true when measure is shared with a different user", () => {
    const canEdit = checkUserCanEdit(
      measure_different_createdBy_different_SharedWith
    );
    expect(canEdit).not.toBeTruthy();
  });
});
