import useOrganizationApi, { OrganizationApi } from "./useOrganizationApi";
import axios from "../api/axios-instance";
import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { ServiceContext } from "./ServiceContext";

jest.mock("../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

describe("useOrganizationApi", () => {
  let organizationApi: OrganizationApi;
  beforeEach(() => {
    const getAccessToken = jest.fn();
    organizationApi = new OrganizationApi("test.url", getAccessToken);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns an error when the organization list appears empty", () => {
    const resp = { status: 200, data: [] };
    mockedAxios.get.mockResolvedValue(resp);
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
    const orgList = await organizationApi.getAllOrganizations();
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(orgList).toEqual(organizations);
  });
});

describe("function useOrganizationApi()", () => {
  const mockConfig = {
    measureService: { baseUrl: "mockBaseUrl" },
  };
  const wrapper = ({ children }) =>
    React.createElement(
      ServiceContext.Provider,
      { value: mockConfig },
      children
    );

  it("returns an instance of OrganizationApi", () => {
    const { result } = renderHook(() => useOrganizationApi(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current).toBeInstanceOf(OrganizationApi);
    expect(result.current.baseUrl).toBe("mockBaseUrl");
    expect(typeof result.current.getAccessToken).toBe("function");
    expect(result.current.getAccessToken()).toBe("test.jwt");
  });
});
