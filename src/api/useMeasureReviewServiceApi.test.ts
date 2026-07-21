import axios from "./axios-instance";
import useMeasureReviewServiceApi, {
  MeasureReviewServiceApi,
} from "./useMeasureReviewServiceApi";
import { ReviewStatus, MeasureReview } from "@madie/madie-models";
import { renderHook } from "@testing-library/react-hooks";
import { ServiceContext } from "./ServiceContext";
import * as React from "react";

jest.mock("./axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "mocked-token",
}));

describe("MeasureReviewServiceApi", () => {
  const mockBaseUrl = "http://localhost/api";
  const mockToken = "mocked-token";

  let api: MeasureReviewServiceApi;
  let mockGetAccessToken: jest.Mock;

  const review: MeasureReview = {
    id: "review-1",
    measureId: "measure-1",
    measureSetId: "set-1",
    status: ReviewStatus.READY_FOR_REVIEW,
    comment: "Reviewed",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessToken = jest.fn().mockReturnValue(mockToken);
    api = new MeasureReviewServiceApi(mockBaseUrl, mockGetAccessToken);
  });

  it("creates a measure review", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: review });

    const result = await api.createMeasureReview("measure-1", review);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/measure-1/review`,
      review,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toEqual(review);
  });

  it("updates a measure review", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: review });

    const result = await api.updateMeasureReview("measure-1", review);

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/measure-1/review`,
      review,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toEqual(review);
  });

  it("fetches a measure review", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: review });

    const result = await api.getMeasureReview("measure-1");

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/measure-1/review`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toEqual(review);
  });

  it("returns null for 404 measure review", async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });

    const result = await api.getMeasureReview("measure-1");

    expect(result).toBeNull();
  });

  it("fetches measure reviews by set id", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [review] });

    const result = await api.getMeasureReviewsByMeasureSetId("set-1");

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/measures/measure-set/set-1/reviews`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toEqual([review]);
  });

  it("hook returns MeasureReviewServiceApi instance", () => {
    const wrapper = ({ children }) =>
      React.createElement(
        ServiceContext.Provider,
        {
          value: {
            measureService: { baseUrl: mockBaseUrl },
          },
        },
        children
      );

    const { result } = renderHook(() => useMeasureReviewServiceApi(), {
      wrapper,
    });

    expect(result.current).toBeInstanceOf(MeasureReviewServiceApi);
  });
});
