import axios from "./axios-instance";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "./useMeasureServiceApi";
import { Group, Measure, OwnershipType } from "@madie/madie-models";
import { libraryElm } from "./__mocks__/cqlLibraryElm";
import { cqlLibraryElm_withFunction } from "./__mocks__/cqlLibraryElm_withFunctiion";
import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { ServiceContext } from "./ServiceContext";

jest.mock("./axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const measure = {
  id: "1",
  measureName: "CQM01",
  cqlLibraryName: "CQM01",
  measureSetId: "1-2-3",
  scoring: "Continuous Variable",
  patientBasis: true,
  cql: "mock cql",
  supplementalData: [
    {
      definition: "SDE Definition Initial Population",
      description: "",
    },
  ],
  testCaseConfiguration: {
    sdeIncluded: true,
  },
} as Measure;
const group = {
  id: "groupId",
  displayId: "Updated Group",
} as unknown as Group;

describe("MeasureServiceApi", () => {
  let measureServiceApi: MeasureServiceApi;
  beforeEach(() => {
    const getAccessToken = jest.fn();
    measureServiceApi = new MeasureServiceApi("test.url", getAccessToken);
  });

  it("It should trigger success fetchMeasureBundle", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    const result = await measureServiceApi.fetchMeasureBundle(measure);
    expect(result).toEqual({});
  });

  it("It should trigger catch fetchMeasureBundle", async () => {
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
    mockedAxios.get.mockRejectedValueOnce({ data: {} });
    await expect(measureServiceApi.fetchMeasureBundle(measure)).rejects.toThrow(
      ""
    );
    expect(consoleErrorMock).toHaveBeenCalledWith("Bundle Error", undefined);
    consoleErrorMock.mockRestore();
  });

  it("should succeed updateMeasure", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: {} });
    const result = await measureServiceApi.updateMeasure(measure);
    expect(mockedAxios.put).toBeCalledTimes(1);
    expect(result.data).toEqual({});
  });

  it("should succeed getCqmMeasure", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    const abortController = new AbortController();
    await measureServiceApi.getCqmMeasure("id", abortController);
    expect(mockedAxios.get).toHaveBeenCalled();
  });
  it("should fail getCqmMeasure", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("failure"));
    const consoleWarnMock = jest.spyOn(console, "warn").mockImplementation();
    const abortController = new AbortController();
    await expect(
      measureServiceApi.getCqmMeasure("id", abortController)
    ).rejects.toThrow("");
    expect(consoleWarnMock).toHaveBeenCalledWith(
      "Unable to retrieve CqmMeasure"
    );
    expect(mockedAxios.get).toHaveBeenCalled();
  });

  it("should return the axios response for updateMeasureTestCaseConfiguration", async () => {
    const response = { data: "updated" };
    mockedAxios.put.mockResolvedValue(response);

    const result = await measureServiceApi.updateMeasureTestCaseConfiguration(
      measure.testCaseConfiguration,
      measure.id
    );

    expect(result).toBe(response);
  });

  it("should propagate errors from axios.put for updateMeasureTestCaseConfiguration", async () => {
    const error = new Error("Network error");
    mockedAxios.put.mockRejectedValue(error);

    await expect(
      measureServiceApi.updateMeasureTestCaseConfiguration(
        measure.testCaseConfiguration,
        measure.id
      )
    ).rejects.toThrow("Network error");
  });

  it("Should succeed updateGroup", async () => {
    mockedAxios.put.mockClear();
    mockedAxios.put.mockResolvedValueOnce({ data: group });
    const result = await measureServiceApi.updateGroup(group, "measureId");
    expect(mockedAxios.put).toBeCalledTimes(1);
    expect(result).toEqual(group);
  });

  it("Should fail updateGroup", async () => {
    mockedAxios.put.mockClear();
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
    const errorMessage = "Failed to update the group.";
    mockedAxios.put.mockRejectedValueOnce({
      status: 500,
      response: { data: {} },
    });
    await expect(
      measureServiceApi.updateGroup(group, "groupId")
    ).rejects.toThrow(errorMessage);
    expect(consoleErrorMock).toHaveBeenCalled();
    consoleErrorMock.mockRestore();
  });

  it("Should fail updateGroup with 423 error", async () => {
    mockedAxios.put.mockClear();
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
    const errorMessage = "Group is locked for editing.";
    mockedAxios.put.mockRejectedValueOnce({
      status: 423,
      response: { data: { message: errorMessage } },
    });
    await expect(
      measureServiceApi.updateGroup(group, "groupId")
    ).rejects.toThrow(errorMessage);
    expect(consoleErrorMock).toHaveBeenCalled();
    consoleErrorMock.mockRestore();
  });

  it("Should fail deleteGroup with 423 error", async () => {
    mockedAxios.delete.mockClear();
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
    const errorMessage = "Group is locked for editing.";
    mockedAxios.delete.mockRejectedValueOnce({
      status: 423,
      response: { data: { message: errorMessage } },
    });
    await expect(
      measureServiceApi.deleteMeasureGroup(group.id, "measureId")
    ).rejects.toThrow(errorMessage);
    expect(consoleErrorMock).toHaveBeenCalled();
    consoleErrorMock.mockRestore();
  });

  it("returns data on success", async () => {
    const ids = ["1"];
    const returned = [{ id: "1" }];
    mockedAxios.post.mockResolvedValueOnce({ data: returned });

    const result = await measureServiceApi.fetchMeasuresByIds(ids);

    expect(result).toEqual(returned);
  });

  it("logs error and throws on failure", async () => {
    const consoleErr = jest.spyOn(console, "error").mockImplementation();
    mockedAxios.post.mockRejectedValueOnce(new Error("?"));

    await expect(measureServiceApi.fetchMeasuresByIds(["1"])).rejects.toThrow(
      "Unable to fetch measures by IDs"
    );

    expect(consoleErr).toHaveBeenCalled();
    consoleErr.mockRestore();
  });
});

jest.mock("./axios-instance", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe("MeasureServiceApi admin coverage", () => {
  const mockBaseUrl = "http://test-url";
  const mockGetAccessToken = jest.fn(() => "mock-token");
  const api = new MeasureServiceApi(mockBaseUrl, mockGetAccessToken);

  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedAxios.put.mockReset();
    mockedAxios.delete.mockReset();
  });

  it("fetchMeasure returns measure for admin", async () => {
    const measure = { id: "m1", name: "Admin Measure" };
    mockedAxios.get.mockResolvedValue({ data: measure });
    const result = await api.fetchMeasure("m1");
    expect(result).toEqual(measure);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/m1`,
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("fetchMeasure throws error for invalid id", async () => {
    mockedAxios.get.mockRejectedValue(new Error("fail"));
    await expect(api.fetchMeasure("badid")).rejects.toThrow();
  });

  it("fetchMeasureDraftStatuses returns draft statuses for admin", async () => {
    const statuses = { m1: "draft", m2: "published" };
    mockedAxios.post.mockResolvedValue({ data: statuses });
    const result = await api.fetchMeasureDraftStatuses(["m1", "m2"]);
    expect(result).toEqual(statuses);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/draftstatus`,
      ["m1", "m2"],
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("fetchMeasureDraftStatuses throws error on failure", async () => {
    mockedAxios.post.mockRejectedValue(new Error("fail"));
    await expect(api.fetchMeasureDraftStatuses(["badid"])).rejects.toThrow();
  });

  it("getMeasuresByMeasureSetId returns measures for admin", async () => {
    const measures = [{ id: "m1", name: "Admin Measure" }];
    mockedAxios.put.mockResolvedValue({ data: measures });
    const result = await api.getMeasuresByMeasureSetId("setId", true, {});
    expect(result).toEqual(measures);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/byMeasureSetId`,
      {},
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("getMeasuresByMeasureSetId throws error for invalid id", async () => {
    mockedAxios.put.mockRejectedValue(new Error("fail"));
    await expect(
      api.getMeasuresByMeasureSetId("badid", true, {})
    ).rejects.toThrow();
  });

  it("test getMeasuresByMeasureSetId with no response.data", async () => {
    mockedAxios.put.mockResolvedValue({ data: null });
    const result = await api.getMeasuresByMeasureSetId("setId", true, {});
    expect(result).toBeUndefined();
  });

  it("getRecentMeasuresByMeasureSetId returns measures for admin", async () => {
    const measures = [{ id: "m1", name: "Admin Measure" }];
    mockedAxios.get.mockResolvedValue({ data: measures });
    const result = await api.getRecentMeasuresByMeasureSetId(["setId"]);
    expect(result).toEqual(measures);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/recentsByMeasureSetId`,
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("getRecentMeasuresByMeasureSetId throws error for invalid id", async () => {
    mockedAxios.get.mockRejectedValue(new Error("fail"));
    await expect(
      api.getRecentMeasuresByMeasureSetId(["badid"])
    ).rejects.toThrow();
  });

  it("getRecentMeasuresByMeasureSetId throws error on failure", async () => {
    mockedAxios.get.mockRejectedValue(new Error("fail"));
    await expect(
      api.getRecentMeasuresByMeasureSetId(["badid"])
    ).rejects.toThrow();
  });

  it("test getRecentMeasuresByMeasureSetId with no response.data", async () => {
    mockedAxios.get.mockResolvedValue({ data: null });
    const result = await api.getRecentMeasuresByMeasureSetId(["setId"]);
    expect(result).toBeUndefined();
  });

  it("fetchMeasures returns measures for admin", async () => {
    const measures = [{ id: "m1", name: "Admin Measure" }];
    mockedAxios.get.mockResolvedValue({ data: measures });
    const result = await api.fetchMeasures(
      OwnershipType.OWNED,
      25,
      0,
      "lastModifiedAt",
      "DESC",
      undefined
    );
    expect(result).toEqual(measures);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures`,
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("fetchMeasures throws error on failure", async () => {
    mockedAxios.get.mockRejectedValue(new Error("fail"));
    await expect(
      api.fetchMeasures(
        OwnershipType.OWNED,
        25,
        0,
        "lastModifiedAt",
        "DESC",
        undefined
      )
    ).rejects.toThrow();
  });

  it("fetchMeasures error.message is cancelled", async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    mockedAxios.get.mockRejectedValue({ message: "canceled" });
    await expect(
      api.fetchMeasures(
        OwnershipType.OWNED,
        25,
        0,
        "lastModifiedAt",
        "DESC",
        signal
      )
    ).rejects.toThrow("canceled");
  });

  it("fetchMeasures uses default limit when not provided", async () => {
    const measures = [{ id: "m1", name: "Admin Measure" }];
    mockedAxios.get.mockResolvedValue({ data: measures });
    // Call without limit argument
    const result = await api.fetchMeasures(
      OwnershipType.OWNED,
      undefined, // skip limit
      0,
      "lastModifiedAt",
      "DESC",
      undefined
    );
    expect(result).toEqual(measures);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures`,
      expect.objectContaining({
        params: expect.objectContaining({ limit: 25 }),
      })
    );
  });

  it("fetchMeasures uses default page when not provided", async () => {
    const measures = [{ id: "m1", name: "Admin Measure" }];
    mockedAxios.get.mockResolvedValue({ data: measures });
    // Call without page argument
    const result = await api.fetchMeasures(
      OwnershipType.OWNED,
      25,
      undefined, // skip page
      "lastModifiedAt",
      "DESC",
      undefined
    );
    expect(result).toEqual(measures);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures`,
      expect.objectContaining({
        params: expect.objectContaining({ page: 0 }),
      })
    );
  });

  it("fetchMeasures uses default sort when not provided", async () => {
    const measures = [{ id: "m1", name: "Admin Measure" }];
    mockedAxios.get.mockResolvedValue({ data: measures });
    // Call without sort argument
    const result = await api.fetchMeasures(
      OwnershipType.OWNED,
      25,
      0,
      undefined, // skip sort
      "DESC",
      undefined
    );
    expect(result).toEqual(measures);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures`,
      expect.objectContaining({
        params: expect.objectContaining({ sort: "lastModifiedAt" }),
      })
    );
  });

  it("fetchMeasures uses default direction when not provided", async () => {
    const measures = [{ id: "m1", name: "Admin Measure" }];
    mockedAxios.get.mockResolvedValue({ data: measures });
    // Call without direction argument
    const result = await api.fetchMeasures(
      OwnershipType.OWNED,
      25,
      0,
      "lastModifiedAt",
      undefined, // skip direction
      undefined
    );
    expect(result).toEqual(measures);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures`,
      expect.objectContaining({
        params: expect.objectContaining({ direction: "DESC" }),
      })
    );
  });

  it("fetchMeasures uses limit All when provided", async () => {
    const measures = [{ id: "m1", name: "Admin Measure" }];
    mockedAxios.get.mockResolvedValue({ data: measures });
    const result = await api.fetchMeasures(
      OwnershipType.OWNED,
      "All",
      0,
      "lastModifiedAt",
      "DESC",
      undefined
    );
    expect(result).toEqual(measures);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures`,
      expect.objectContaining({
        params: expect.objectContaining({ limit: 1000 }),
      })
    );
  });

  it("deleteMeasure deletes a measure", async () => {
    mockedAxios.delete.mockResolvedValue({});
    await expect(api.deleteMeasure("m1")).resolves.toStrictEqual({});
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/m1/delete`,
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("createGroup creates a group", async () => {
    const group = { id: "g1", name: "New Group" } as unknown as Group;
    mockedAxios.post.mockResolvedValue({ data: group });
    const result = await api.createGroup(group, "m1");
    expect(result).toEqual(group);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/m1/groups`,
      group,
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("createGroup throws error on failure", async () => {
    const group = { id: "g1", name: "New Group" } as unknown as Group;
    mockedAxios.post.mockRejectedValue(new Error("fail"));
    await expect(api.createGroup(group, "m1")).rejects.toThrow();
  });

  it("createGroup responseData includes 'Request Rejected'", async () => {
    const group = { id: "g1", name: "New Group" } as unknown as Group;
    mockedAxios.post.mockResolvedValue({
      data: { message: "Request Rejected" },
    });
    await expect(api.createGroup(group, "m1")).rejects.toThrow(
      "Failed to create the group."
    );
  });

  it("deleteMeasureGroup deletes a measure group", async () => {
    mockedAxios.delete.mockResolvedValue({});
    await expect(api.deleteMeasureGroup("g1", "m1")).resolves.toBeUndefined();
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/m1/groups/g1`,
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("deleteMeasureGroup group or measure id cannot be null", async () => {
    await expect(api.deleteMeasureGroup("", "m1")).rejects.toThrow(
      "Failed to delete the measure group."
    );
    await expect(api.deleteMeasureGroup("g1", "")).rejects.toThrow(
      "Failed to delete the measure group."
    );
  });

  it("associateCmsId associates a CMS ID with a measure", async () => {
    const qiCoreMeasureId = "m1";
    const qdmMeasureId = "cms1";
    const copyMetaData = false;
    mockedAxios.put.mockResolvedValue({ data: {} });
    await expect(
      api.associateCmsId(qiCoreMeasureId, qdmMeasureId, copyMetaData)
    ).resolves.toStrictEqual({});
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/cms-id-association`,
      {},
      expect.objectContaining({
        headers: expect.any(Object),
        params: {
          qiCoreMeasureId,
          qdmMeasureId,
          copyMetaData,
        },
      })
    );
  });

  it("updateGroup requestData includes 'Request Rejected'", async () => {
    const groupId = "g1";
    const group = {
      id: groupId,
      name: "Updated Group",
      measureGroupTypes: ["type1"],
    } as any;
    mockedAxios.put.mockResolvedValue({ data: "Request Rejected" });
    await expect(api.updateGroup(group, groupId)).rejects.toThrow(
      "Failed to update the group."
    );
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/${groupId}/groups`,
      group,
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("buildErrorMessage err?.response?.status is 400", () => {
    const error = {
      response: { status: 400, data: { message: "Bad Request" } },
    };
    const result = api.buildErrorMessage(error, "Custom context");
    expect(result).toBe("Bad Request");
  });

  it("buildErrorMessage err.response.data?.validationErrors?.group is present", () => {
    const error = {
      response: {
        status: 400,
        data: {
          message: "Bad Request",
          validationErrors: {
            group: "Group is required",
          },
        },
      },
    };
    const result = api.buildErrorMessage(error, "Custom context");
    expect(result).toBe(
      "Missing required populations for selected scoring type."
    );
  });

  it("buildErrorMessage when err.response.data.message is not present", () => {
    const error = {
      response: {
        status: 400,
        data: {},
      },
    };
    const result = api.buildErrorMessage(error, "Something wrong");
    expect(result).toBe("Something wrong");
  });

  it("getAllPopulationBasisOptions returns options", async () => {
    const options = [{ id: "1", name: "Option 1" }];
    mockedAxios.get.mockResolvedValue({ data: options });
    const result = await api.getAllPopulationBasisOptions();
    expect(result).toEqual(options);
  });

  it("getAllPopulationBasisOptions response?.data.length < 1", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    await expect(api.getAllPopulationBasisOptions()).rejects.toThrow(
      "Unable to fetch population basis options"
    );
  });

  it("getAllOrganizations returns organizations", async () => {
    const organizations = [{ id: "1", name: "Organization 1" }];
    mockedAxios.get.mockResolvedValue({ data: organizations });
    const result = await api.getAllOrganizations();
    expect(result).toEqual(organizations);
  });

  it("getAllOrganizations response?.data.length < 1", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    await expect(api.getAllOrganizations()).rejects.toThrow(
      "Unable to fetch organizations"
    );
  });

  it("getAllEndorsers returns endorsers", async () => {
    const endorsers = [{ id: "1", name: "Endorser 1" }];
    mockedAxios.get.mockResolvedValue({ data: endorsers });
    const result = await api.getAllEndorsers();
    expect(result).toEqual(endorsers);
  });

  it("getAllEndorsers response?.data.length < 1", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    await expect(api.getAllEndorsers()).rejects.toThrow(
      "Unable to fetch endorsers"
    );
  });

  it("get return types for all cql definitions when no definition is found", () => {
    let returnTypes = api.getReturnTypesForAllCqlDefinitions("");
    expect(returnTypes).toEqual({});

    returnTypes = api.getReturnTypesForAllCqlDefinitions('{"library":{}}');
    expect(returnTypes).toEqual({});

    returnTypes = api.getReturnTypesForAllCqlDefinitions(
      '{"library":{"statements": {}}}'
    );
    expect(returnTypes).toEqual({});
  });

  it("get return types for all cql definitions", () => {
    let returnTypes = api.getReturnTypesForAllCqlDefinitions(libraryElm);
    expect(returnTypes["initialPopulation"]).toEqual("Boolean");

    expect(returnTypes["firstBladderCancerStagingProcedure"]).toEqual(
      "Procedure"
    );

    expect(returnTypes["numerator"]).toEqual("Boolean");

    expect(returnTypes["firstBcgAdministered"]).toEqual(
      "MedicationAdministration"
    );

    expect(returnTypes["normalizePeriod"]).toEqual("DateTime");
  });

  it("getReturnTypesForAllCqlFunctions returns {} when no elmJson passed in", async () => {
    const result = await api.getReturnTypesForAllCqlFunctions("");
    expect(result).toEqual({});
  });

  it("get return types for all cql functions", () => {
    let returnTypes = api.getReturnTypesForAllCqlFunctions(libraryElm);
    // Only assert for function definitions present in the mock ELM
    expect(returnTypes["normalizePeriod"]).toEqual("N/A");
  });

  it("test get return types for all cql functions", () => {
    const cqlLibraryElm_withFunction_isVerified = {
      library: {
        statements: {
          def: [cqlLibraryElm_withFunction.library.statements.def[0]],
        },
      },
    };
    let returnTypes = api.getReturnTypesForAllCqlFunctions(
      JSON.stringify(cqlLibraryElm_withFunction_isVerified)
    );
    expect(returnTypes["isVerified"]).toEqual("N/A");

    const cqlLibraryElm_withFunction_measureObservation = {
      library: {
        statements: {
          def: [cqlLibraryElm_withFunction.library.statements.def[1]],
        },
      },
    };
    returnTypes = api.getReturnTypesForAllCqlFunctions(
      JSON.stringify(cqlLibraryElm_withFunction_measureObservation)
    );
    expect(returnTypes["measureObservation1"]).toEqual("Encounter");

    const cqlLibraryElm_withFunction_isNotRejected = {
      library: {
        statements: {
          def: [cqlLibraryElm_withFunction.library.statements.def[2]],
        },
      },
    };
    returnTypes = api.getReturnTypesForAllCqlFunctions(
      JSON.stringify(cqlLibraryElm_withFunction_isNotRejected)
    );
    expect(returnTypes["isNotRejected"]).toEqual("Boolean");

    const cqlLibraryElm_withFunction_nonFunction = {
      library: {
        statements: {
          def: [cqlLibraryElm_withFunction.library.statements.def[3]],
        },
      },
    };

    returnTypes = api.getReturnTypesForAllCqlFunctions(
      JSON.stringify(cqlLibraryElm_withFunction_nonFunction)
    );
    expect(returnTypes).toEqual({});
  });

  it("test getReturnTypesForAllCqlFunctions line 452 when there is no function", () => {
    const cqlLibraryElm_withFunction_nonFunction = {
      library: {
        statements: {},
      },
    };

    const returnTypes = api.getReturnTypesForAllCqlFunctions(
      JSON.stringify(cqlLibraryElm_withFunction_nonFunction)
    );
    expect(returnTypes).toEqual({});
  });

  it("test searchMeasuresByMeasureNameOrEcqmTitle success", async () => {
    const measures: Measure[] = [
      {
        id: "IDIDID1",
        measureName: "measure - A",
      } as Measure,
      {
        id: "IDIDID2",
        measureName: "measure - B",
      } as Measure,
      {
        id: "IDIDID3",
        measureName: "measure - C",
      } as Measure,
    ];
    const resp: any = { status: 200, data: measures };
    mockedAxios.put.mockResolvedValue(resp);

    const measuresList = await api.searchMeasuresByCriteria(
      [OwnershipType.OWNED],
      25,
      0,
      "lastModifiedAt",
      "DESC",
      { searchField: "test", optionalSearchProperties: [] },
      new AbortController()
    );
    expect(mockedAxios.put).toBeCalledTimes(1);
    expect(measuresList).toEqual(measures);
  });

  it("test searchMeasuresByMeasureNameOrEcqmTitle fail", async () => {
    const resp = { status: 500, data: "failure", error: { message: "error" } };
    mockedAxios.put.mockRejectedValueOnce(resp);

    try {
      await api.searchMeasuresByCriteria(
        [OwnershipType.OWNED],
        25,
        0,
        "lastModifiedAt",
        "DESC",
        { searchField: "test", optionalSearchProperties: [] },
        new AbortController()
      );
      expect(mockedAxios.put).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to search measures");
    }
  });

  it("test searchMeasuresByMeasureNameOrEcqmTitle cancels", async () => {
    const resp = {
      status: 500,
      data: "failure",
      message: "canceled",
    };
    mockedAxios.put.mockRejectedValueOnce(resp);

    try {
      await api.searchMeasuresByCriteria(
        [OwnershipType.OWNED],
        25,
        0,
        "lastModifiedAt",
        "DESC",
        { searchField: "test", optionalSearchProperties: [] },
        new AbortController()
      );
      expect(mockedAxios.put).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("canceled");
    }
  });

  it("checkNextVersionNumber returns the next version number", async () => {
    const currentVersion = "1.0.0";
    const versionType = "MAJOR";
    mockedAxios.get.mockResolvedValue({ data: "1.0.1" });
    const nextVersion = await api.checkNextVersionNumber(
      currentVersion,
      versionType
    );
    expect(nextVersion).toEqual("1.0.1");
  });

  it("checkNextVersionNumber throws an error for invalid version type", async () => {
    const currentVersion = "1.0.0";
    const versionType = "INVALID";
    try {
      await api.checkNextVersionNumber(currentVersion, versionType);
    } catch (error) {
      expect(error.message).toBe("Invalid version type");
    }
  });

  it("unlockMeasures unlocks measures successfully", async () => {
    const resp = { status: 200, data: "success" };
    mockedAxios.delete.mockResolvedValue(resp);

    const result = await api.unlockMeasures();
    expect(mockedAxios.delete).toBeCalledTimes(1);
    expect(result).toEqual("success");
  });

  it("unlockMeasures fails to unlock measures", async () => {
    const resp = { status: 500, data: "failure", error: { message: "error" } };
    mockedAxios.delete.mockRejectedValueOnce(resp);

    try {
      await api.unlockMeasures();
      expect(mockedAxios.delete).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("[object Object]");
    }
  });

  it("should succeed getMeasureHistoryLogs", async () => {
    const mockData = [{ action: "VIEW", timestamp: "2024-01-01T00:00:00Z" }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });
    const result = await api.getMeasureHistoryLogs("1");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://test-url/measures/1/history",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.any(String),
        }),
      })
    );
    expect(result).toEqual(mockData);
  });

  it("should fail getMeasureHistoryLogs and log warning", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("failure"));
    const consoleWarnMock = jest.spyOn(console, "warn").mockImplementation();
    await expect(api.getMeasureHistoryLogs("1")).rejects.toThrow("failure");
    expect(consoleWarnMock).toHaveBeenCalledWith(
      "Unable to retrieve Measure History Logs"
    );
    consoleWarnMock.mockRestore();
  });

  it("returns true when the API indicates test cases are locked", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: true });
    const result = await api.checkTestCasesLocked("1");
    expect(result).toBe(true);
  });

  it("returns false when the API indicates test cases are not locked", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: false });
    const result = await api.checkTestCasesLocked("1");
    expect(result).toBe(false);
  });

  it("returns false and logs an error when the API call fails", async () => {
    jest.spyOn(console, "error").mockImplementation();
    mockedAxios.get.mockRejectedValueOnce(new Error("failure"));
    const consoleWarnMock = jest.spyOn(console, "warn").mockImplementation();
    await expect(api.checkTestCasesLocked("1")).rejects.toThrow("failure");
    expect(consoleWarnMock).toHaveBeenCalledWith(
      "Unable to retrieve Test Cases lock info"
    );
    consoleWarnMock.mockRestore();
  });

  it("serializes ownershipTypes array as repeated params", async () => {
    const measures = [{ id: "1", measureName: "A" }];
    mockedAxios.put.mockResolvedValue({ status: 200, data: measures });

    const ownershipTypes = ["OWNED", "SHARED"];
    const searchCriteria = {
      searchField: "test",
      optionalSearchProperties: [],
    };
    const abortController = new AbortController();

    await api.searchMeasuresByCriteria(
      [OwnershipType.OWNED, OwnershipType.SHARED],
      25,
      0,
      "lastModifiedAt",
      "DESC",
      searchCriteria,
      abortController
    );

    // Check that paramsSerializer is used and serializes as repeat
    const callConfig = mockedAxios.put.mock.calls[0][2];
    // @ts-ignore
    const serialized = callConfig.paramsSerializer({ ownershipTypes });
    expect(serialized).toContain("ownershipTypes=OWNED");
    expect(serialized).toContain("ownershipTypes=SHARED");
  });

  it("searchMeasuresByCriteria uses default limit", async () => {
    const measures = [{ id: "1", measureName: "A" }];
    mockedAxios.put.mockResolvedValue({ status: 200, data: measures });

    const ownershipTypes = ["OWNED", "SHARED"];
    const searchCriteria = {
      searchField: "test",
      optionalSearchProperties: [],
    };
    const abortController = new AbortController();

    await api.searchMeasuresByCriteria(
      [OwnershipType.OWNED, OwnershipType.SHARED],
      undefined,
      0,
      "lastModifiedAt",
      "DESC",
      searchCriteria,
      abortController
    );

    // Check that paramsSerializer is used and serializes as repeat
    const callConfig = mockedAxios.put.mock.calls[0][2];
    // @ts-ignore
    const serialized = callConfig.paramsSerializer({ ownershipTypes });
    expect(serialized).toContain("ownershipTypes=OWNED");
    expect(serialized).toContain("ownershipTypes=SHARED");
  });

  it("searchMeasuresByCriteria uses default page", async () => {
    const measures = [{ id: "1", measureName: "A" }];
    mockedAxios.put.mockResolvedValue({ status: 200, data: measures });

    const ownershipTypes = ["OWNED", "SHARED"];
    const searchCriteria = {
      searchField: "test",
      optionalSearchProperties: [],
    };
    const abortController = new AbortController();

    await api.searchMeasuresByCriteria(
      [OwnershipType.OWNED, OwnershipType.SHARED],
      25,
      undefined,
      "lastModifiedAt",
      "DESC",
      searchCriteria,
      abortController
    );

    // Check that paramsSerializer is used and serializes as repeat
    const callConfig = mockedAxios.put.mock.calls[0][2];
    // @ts-ignore
    const serialized = callConfig.paramsSerializer({ ownershipTypes });
    expect(serialized).toContain("ownershipTypes=OWNED");
    expect(serialized).toContain("ownershipTypes=SHARED");
  });

  it("searchMeasuresByCriteria uses default sort", async () => {
    const measures = [{ id: "1", measureName: "A" }];
    mockedAxios.put.mockResolvedValue({ status: 200, data: measures });

    const ownershipTypes = ["OWNED", "SHARED"];
    const searchCriteria = {
      searchField: "test",
      optionalSearchProperties: [],
    };
    const abortController = new AbortController();

    await api.searchMeasuresByCriteria(
      [OwnershipType.OWNED, OwnershipType.SHARED],
      25,
      0,
      undefined,
      undefined,
      searchCriteria,
      abortController
    );

    // Check that paramsSerializer is used and serializes as repeat
    const callConfig = mockedAxios.put.mock.calls[0][2];
    // @ts-ignore
    const serialized = callConfig.paramsSerializer({ ownershipTypes });
    expect(serialized).toContain("ownershipTypes=OWNED");
    expect(serialized).toContain("ownershipTypes=SHARED");
  });

  it("searchMeasuresByCriteria limit All", async () => {
    const measures = [{ id: "1", measureName: "A" }];
    mockedAxios.put.mockResolvedValue({ status: 200, data: measures });

    const ownershipTypes = ["OWNED", "SHARED"];
    const searchCriteria = {
      searchField: "test",
      optionalSearchProperties: [],
    };
    const abortController = new AbortController();

    await api.searchMeasuresByCriteria(
      [OwnershipType.OWNED, OwnershipType.SHARED],
      "All",
      0,
      "lastModifiedAt",
      "DESC",
      searchCriteria,
      abortController
    );

    // Check that paramsSerializer is used and serializes as repeat
    const callConfig = mockedAxios.put.mock.calls[0][2];
    // @ts-ignore
    const serialized = callConfig.paramsSerializer({ ownershipTypes });
    expect(serialized).toContain("ownershipTypes=OWNED");
    expect(serialized).toContain("ownershipTypes=SHARED");
  });

  // getSharedAccessReportForMeasures tests
  it("should call PUT with correct URL, ids body, blob responseType, and auth header on success", async () => {
    const mockBlob = new Blob(["report content"], {
      type: "application/vnd.ms-excel",
    });
    mockedAxios.put.mockResolvedValueOnce({ data: mockBlob });

    const ids = ["measure-id-1", "measure-id-2"];
    const result = await api.getSharedAccessReportForMeasures(ids);

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/admin/measures/shared-access-report`,
      ids,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer mock-token`,
        }),
        responseType: "blob",
      })
    );
    expect(result).toBe(mockBlob);
  });

  it("should throw error when the API call fails", async () => {
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
    const error = new Error("Network error");
    mockedAxios.put.mockRejectedValueOnce(error);

    await expect(
      api.getSharedAccessReportForMeasures(["id-1"])
    ).rejects.toThrow("Network error");

    expect(consoleErrorMock).toHaveBeenCalledWith(
      "Failed to export measure access report",
      error
    );
    consoleErrorMock.mockRestore();
  });

  it("should succeed validateHarpId", async () => {
    const mockResponse = { status: 200, data: true };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);
    const result = await api.validateHarpId("testUser");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/harp-id/validate`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.any(String),
        }),
        params: { harpId: "testUser" },
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("should fail validateHarpId and log error", async () => {
    mockedAxios.get.mockRejectedValueOnce(
      new Error(
        "The provided HARP ID is not associated with an active MADiE user."
      )
    );
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
    await expect(api.validateHarpId("testUser")).rejects.toThrow(
      "The provided HARP ID is not associated with an active MADiE user."
    );
    expect(consoleErrorMock).toHaveBeenCalledWith(
      "Failed to validate HARP ID",
      expect.any(Error)
    );
    consoleErrorMock.mockRestore();
  });
});

describe("useMeasureServiceApi hook", () => {
  const mockConfig = {
    measureService: { baseUrl: "mockBaseUrl" },
    getAccessToken: () => "test.jwt",
  };
  const wrapper = ({ children }) =>
    React.createElement(
      ServiceContext.Provider,
      { value: mockConfig },
      children
    );
  it("returns a MeasureServiceApi instance", () => {
    const { result } = renderHook(() => useMeasureServiceApi(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current).toBeInstanceOf(MeasureServiceApi);
  });
});
