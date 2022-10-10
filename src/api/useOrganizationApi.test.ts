import useOrganizationApi, {
  OrganizationApi,
  getServiceUrl,
} from "./useOrganizationApi";
import { ServiceConfig } from "../Config/Config";
import axios from "axios";
import { waitFor } from "@testing-library/react";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockConfig: ServiceConfig = {
  measureService: {
    baseUrl: "url",
  },
  elmTranslationService: {
    baseUrl: "",
  },
  terminologyService: {
    baseUrl: "",
  },
};

const organizations = [
  {
    id: "1234",
    name: "Org1",
    oid: "1.2.3.4",
  },
  {
    id: "56789",
    name: "Org2",
    oid: "5.6.7.8",
  },
];

jest.mock("../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

jest.mock("../Config/Config", () => {
  return {
    getServiceConfig: jest.fn(() => Promise.resolve(mockConfig)),
  };
});

describe("useOrganizationApi", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should retrieve the service url", async () => {
    const actual = await getServiceUrl();
    expect(actual).toBe("url");
  });

  it("useOrganizationApi returns OrganizationApi", () => {
    const actual: OrganizationApi = useOrganizationApi();
    expect(actual).toBeTruthy();
  });

  it("returns an error when the organization list appears empty", () => {
    const resp = { status: 200, data: [] };
    mockedAxios.get.mockResolvedValue(resp);
    expect.assertions(1);
    const organizationApi: OrganizationApi = useOrganizationApi();
    organizationApi
      .getAllOrganizations()
      .then()
      .catch((err) => {
        expect(err).not.toBeNull();
      });
  });

  it("retrieves the organization list", async () => {
    const resp = { status: 200, data: organizations };
    mockedAxios.get.mockResolvedValue(resp);
    const organizationApi: OrganizationApi = useOrganizationApi();
    const orgList = await organizationApi.getAllOrganizations();
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(orgList).toEqual(organizations);
  });
});
