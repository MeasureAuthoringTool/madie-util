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

  it("should return true when user name and createdBy are the same and draft is true", () => {
    const canEdit = useCheckUserCanDelete(JANE_DOE, true);
    expect(canEdit).toBeTruthy();
  });

  it("should return false when user name and createdBy are not the same", () => {
    const canEdit = useCheckUserCanDelete(JOHN_DOE, true);
    expect(canEdit).not.toBeTruthy();
  });

  it("should return false when user name and createdBy are same but it is not draft", () => {
    const canEdit = useCheckUserCanDelete(JANE_DOE, false);
    expect(canEdit).not.toBeTruthy();
  });

  it("should return true when user name and createdBy are the same ", () => {
    const canEdit = useCheckUserCanDelete(JANE_DOE);
    expect(canEdit).toBeTruthy();
  });
});
