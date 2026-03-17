import axios from "./axios-instance";
import useCqlLibraryServiceApi, {
  CqlLibraryServiceApi,
} from "./useCqlLibraryServiceApi";
import { CqlLibrary, OwnershipType } from "@madie/madie-models";
import { renderHook } from "@testing-library/react-hooks";
import { ServiceContext } from "./ServiceContext";
import React from "react";

jest.mock("./axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "mocked-token",
}));

describe("useCqlLibraryServiceApi", () => {
  const mockBaseUrl = "http://localhost/api";
  const mockToken = "mocked-token";

  let cqlLibraryServiceApi: CqlLibraryServiceApi;
  let mockGetAccessToken: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockGetAccessToken = jest.fn().mockReturnValue(mockToken);
    cqlLibraryServiceApi = new CqlLibraryServiceApi(
      mockBaseUrl,
      mockGetAccessToken
    );
  });

  it("should create and return CqlLibraryServiceApi instance with correct config", () => {
    expect(cqlLibraryServiceApi).toBeInstanceOf(CqlLibraryServiceApi);
    expect(cqlLibraryServiceApi["baseUrl"]).toBe(mockBaseUrl);
    expect(typeof cqlLibraryServiceApi["getAccessToken"]).toBe("function");
  });

  it("should unlock libraries successfully", async () => {
    const expectedResponse = "Libraries unlocked";
    mockedAxios.delete.mockResolvedValueOnce({ data: expectedResponse });

    const result = await cqlLibraryServiceApi.unlockLibraries();

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/unlock`,
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      }
    );
    expect(result).toBe(expectedResponse);
  });

  it("should throw error when unlock fails", async () => {
    const error = new Error("Failed to unlock libraries");
    mockedAxios.delete.mockRejectedValueOnce(error);

    await expect(cqlLibraryServiceApi.unlockLibraries()).rejects.toThrowError(
      error.message
    );

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/unlock`,
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      }
    );
  });

  it("should fetch Cql Libraries", async () => {
    const mockedResponse = { data: [{ id: "1" }] };
    mockedAxios.put.mockResolvedValueOnce(mockedResponse);
    const result = await cqlLibraryServiceApi.fetchCqlLibraries(
      OwnershipType.OWNED,
      25,
      0,
      {},
      undefined,
      undefined
    );
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/searches`,
      {},
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
        params: expect.objectContaining({
          ownershipType: "OWNED",
          limit: 25,
          page: 0,
        }),
      })
    );
    expect(result).toEqual(mockedResponse.data);
  });

  it("should handle error in fetchCqlLibraries", async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error("canceled"));
    await expect(
      cqlLibraryServiceApi.fetchCqlLibraries(
        OwnershipType.OWNED,
        25,
        0,
        {},
        undefined,
        undefined
      )
    ).rejects.toThrow("canceled");
  });

  it("should fetch a single Cql Library", async () => {
    const mockedResponse = { data: { id: "1" } };
    mockedAxios.get.mockResolvedValueOnce(mockedResponse);
    const result = await cqlLibraryServiceApi.fetchCqlLibrary("1");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/1`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toEqual(mockedResponse.data);
  });

  it("should handle error in fetchCqlLibrary", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("fail"));
    await expect(cqlLibraryServiceApi.fetchCqlLibrary("1")).rejects.toThrow(
      "Unable to fetch cql library"
    );
  });

  it("should create a Cql Library", async () => {
    mockedAxios.post.mockResolvedValueOnce({});
    await cqlLibraryServiceApi.createCqlLibrary({ id: "1" } as any);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries`,
      { id: "1" },
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
  });

  it("should update a Cql Library", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: { id: "1" } });
    await cqlLibraryServiceApi.updateCqlLibrary({ id: "1" } as any);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/1`,
      { id: "1" },
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
  });

  it("should create a version", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: { id: "1" } });
    await cqlLibraryServiceApi.createVersion("1", true);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/version/1?isMajor=true`,
      {},
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
  });

  it("should create a draft", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { id: "1" } });
    await cqlLibraryServiceApi.createDraft("1", "LibName", "QDM");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/draft/1`,
      { cqlLibraryName: "LibName", model: "QDM" },
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
  });

  it("should delete a draft", async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: { id: "1" } });
    await cqlLibraryServiceApi.deleteDraft("1");
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/1`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
  });

  it("should fetch all owners", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: ["owner1"] });
    const ids = ["id1", "id2"];
    const result = await cqlLibraryServiceApi.fetchAllOwners(ids);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/getAllOwners`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
        params: { librarySetIds: "id1,id2" },
      })
    );
    expect(result).toEqual(["owner1"]);
  });

  it("should handle error in fetchAllOwners", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("fail"));
    await expect(cqlLibraryServiceApi.fetchAllOwners(["id1"])).rejects.toThrow(
      "Unable to fetch library owners"
    );
  });

  it("should share libraries", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: "shared" });
    const map = new Map([["id1", ["user1"]]]);
    const result = await cqlLibraryServiceApi.shareLibraries(map);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/share`,
      { id1: ["user1"] },
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toBe("shared");
  });

  it("should handle error in shareLibraries", async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error("fail"));
    const map = new Map([["id1", ["user1"]]]);
    await expect(cqlLibraryServiceApi.shareLibraries(map)).rejects.toThrow();
  });

  it("should get shared libraries", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: ["user1"] });
    const ids = ["id1", "id2"];
    const result = await cqlLibraryServiceApi.getSharedLibraries(ids);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/shared?libraryIds=${ids}`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toEqual(["user1"]);
  });

  it("should handle error in getSharedLibraries", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("fail"));
    await expect(
      cqlLibraryServiceApi.getSharedLibraries(["id1"])
    ).rejects.toThrow();
  });

  it("should get recent libraries by librarySetId", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: ["lib1"] });
    const ids = ["id1", "id2"];
    const result = await cqlLibraryServiceApi.getRecentLibrariesByLibrarySetId(
      ids
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/recentsByLibrarySetId`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
        params: { librarySetIds: "id1,id2" },
      })
    );
    expect(result).toEqual(["lib1"]);
  });

  it("should handle error in getRecentLibrariesByLibrarySetId", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("fail"));
    await expect(
      cqlLibraryServiceApi.getRecentLibrariesByLibrarySetId(["id1"])
    ).rejects.toThrow();
  });

  it("getRecentLibrariesByLibrarySetId when there is no response.data", async () => {
    mockedAxios.get.mockResolvedValueOnce({});
    const result = await cqlLibraryServiceApi.getRecentLibrariesByLibrarySetId([
      "id1",
    ]);
    expect(result).toEqual(undefined);
  });

  it("should unshare libraries", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: "unshared" });
    const map = new Map([["id1", ["user1"]]]);
    const result = await cqlLibraryServiceApi.unshareLibraries(map);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/unshare`,
      { id1: ["user1"] },
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toBe("unshared");
  });

  it("should handle error in unshareLibraries", async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error("fail"));
    const map = new Map([["id1", ["user1"]]]);
    await expect(cqlLibraryServiceApi.unshareLibraries(map)).rejects.toThrow();
  });

  it("should get libraries by librarySetId", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: ["lib1"] });
    const result = await cqlLibraryServiceApi.getLibrariesByLibrarySetId(
      "id1",
      true,
      { criteria: "test" }
    );
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/byLibrarySetId`,
      { criteria: "test" },
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
        params: { librarySetId: "id1", sortByLatestVersion: true },
      })
    );
    expect(result).toEqual(["lib1"]);
  });

  it("should handle error in getLibrariesByLibrarySetId", async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error("fail"));
    await expect(
      cqlLibraryServiceApi.getLibrariesByLibrarySetId("id1", true, {
        criteria: "test",
      })
    ).rejects.toThrow();
  });

  it("getLibrariesByLibrarySetId when there is no response.data", async () => {
    mockedAxios.put.mockResolvedValueOnce({});
    const result = await cqlLibraryServiceApi.getLibrariesByLibrarySetId(
      "id1",
      true,
      {
        criteria: "test",
      }
    );
    expect(result).toEqual(undefined);
  });

  it("should lock a library", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: "locked" });
    const result = await cqlLibraryServiceApi.lockLibrary("lib1");
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/lib1/lock`,
      null,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toBe("locked");
  });

  it("should handle error in lockLibrary", async () => {
    mockedAxios.post.mockRejectedValueOnce("fail");
    await expect(cqlLibraryServiceApi.lockLibrary("lib1")).rejects.toThrow();
  });

  it("should unlock a library", async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: "unlocked" });
    const result = await cqlLibraryServiceApi.unlockLibrary("lib1");
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/lib1/lock`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toBe("unlocked");
  });

  it("should handle error in unlockLibrary", async () => {
    mockedAxios.delete.mockRejectedValueOnce("fail");
    await expect(cqlLibraryServiceApi.unlockLibrary("lib1")).rejects.toThrow();
  });

  it("test fetchCqlLibraries Unable to fetch Cql Libraries", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("fail"));
    await expect(
      cqlLibraryServiceApi.fetchCqlLibraries(
        OwnershipType.OWNED,
        25,
        0,
        {},
        undefined,
        undefined
      )
    ).rejects.toThrow();
  });

  it("fetchCqlLibraries skip limit, page", async () => {
    const mockedResponse = { data: [{ id: "1" }] };
    mockedAxios.put.mockResolvedValueOnce(mockedResponse);
    const result = await cqlLibraryServiceApi.fetchCqlLibraries(
      OwnershipType.OWNED,
      undefined,
      undefined,
      {},
      undefined,
      undefined
    );
    expect(result).toEqual(mockedResponse.data);
  });

  it("fetchCqlLibraries limit is All", async () => {
    const mockedResponse = { data: [{ id: "1" }] };
    mockedAxios.put.mockResolvedValueOnce(mockedResponse);
    const result = await cqlLibraryServiceApi.fetchCqlLibraries(
      OwnershipType.OWNED,
      "All",
      undefined,
      {},
      undefined,
      undefined
    );
    expect(result).toEqual(mockedResponse.data);
  });

  it("test function useCqlLibraryServiceApi", () => {
    const mockConfig = {
      cqlLibraryService: {
        baseUrl: mockBaseUrl,
      },
    };
    const wrapper = ({ children }) =>
      React.createElement(
        ServiceContext.Provider,
        { value: mockConfig },
        children
      );
    const { result } = renderHook(() => useCqlLibraryServiceApi(), { wrapper });
    expect(result.current).toBeInstanceOf(CqlLibraryServiceApi);
  });

  it("test getCqlDiff", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: "diff" });
    const result = await cqlLibraryServiceApi.getCqlDiff("lib1", "lib2");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/lib1/compare/lib2`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toBe("diff");
  });

  it("test getCqlDiff when error occurs", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("fail"));
    await expect(
      cqlLibraryServiceApi.getCqlDiff("lib1", "lib2")
    ).rejects.toThrow();
  });

  it("test getLibraryHistory", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "lib1",
      cqlLibraryName: "Library 1",
    } as unknown as CqlLibrary;
    mockedAxios.get.mockResolvedValueOnce({ data: "history" });
    const result = await cqlLibraryServiceApi.getLibraryHistory(cqlLibrary);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/lib1/history`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toBe("history");
  });

  it("test getLibraryHistory when error occurs", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "lib1",
      cqlLibraryName: "Library 1",
    } as unknown as CqlLibrary;
    mockedAxios.get.mockRejectedValueOnce(new Error("fail"));
    await expect(
      cqlLibraryServiceApi.getLibraryHistory(cqlLibrary)
    ).rejects.toThrow();
  });

  it("test transferLibraries", async () => {
    const libraryIds = ["lib1", "lib2"];
    mockedAxios.put.mockResolvedValueOnce({ data: "success" });
    const result = await cqlLibraryServiceApi.transferLibraries(
      libraryIds,
      "harpId",
      true
    );
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/transfer`,
      libraryIds,
      expect.objectContaining({
        headers: {
          Authorization: `Bearer ${mockToken}`,
          harpId: "harpId",
        },
        params: {
          retainShareAccess: true,
        },
      })
    );
    expect(result).toStrictEqual({ data: "success" });
  });

  it("test transferLibraries when error occurs", async () => {
    const libraryIds = ["lib1", "lib2"];
    mockedAxios.put.mockRejectedValueOnce(new Error("fail"));
    await expect(
      cqlLibraryServiceApi.transferLibraries(libraryIds, "harpId", true)
    ).rejects.toThrow();
  });

  it("test getLibraryHistory throws error with error.message if present", async () => {
    const error = { message: "custom error" };
    mockedAxios.get.mockRejectedValueOnce(error);
    await expect(
      cqlLibraryServiceApi.getLibraryHistory({ id: "id" } as any)
    ).rejects.toThrow("custom error");
  });

  it("test getLibraryHistory throws fallback error message if error is null", async () => {
    mockedAxios.get.mockRejectedValueOnce(null);
    await expect(
      cqlLibraryServiceApi.getLibraryHistory({ id: "id" } as any)
    ).rejects.toThrow("Cannot read properties of null (reading 'message')");
  });

  it("test getLibraryHistory throws fallback error message if error is a string", async () => {
    mockedAxios.get.mockRejectedValueOnce("some string error");
    await expect(
      cqlLibraryServiceApi.getLibraryHistory({ id: "id" } as any)
    ).rejects.toThrow("Failed to fetch library history");
  });

  it("test getLibraryHistory throws fallback error message if error is null", async () => {
    mockedAxios.get.mockRejectedValueOnce(null);
    await expect(
      cqlLibraryServiceApi.getLibraryHistory({ id: "id" } as any)
    ).rejects.toThrow("Cannot read properties of null (reading 'message')");
  });
});
