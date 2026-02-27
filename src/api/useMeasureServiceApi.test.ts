import axios from "./axios-instance";
import { MeasureServiceApi } from "./useMeasureServiceApi";
import { Group, Measure } from "@madie/madie-models";
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
});
