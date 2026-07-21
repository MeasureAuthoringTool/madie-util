import axios from "./axios-instance";
import useCqlLibraryReviewServiceApi, {
  CqlLibraryReviewServiceApi,
} from "./useCqlLibraryReviewServiceApi";
import { ReviewStatus, CqlLibraryReview } from "@madie/madie-models";
import { renderHook } from "@testing-library/react-hooks";
import { ServiceContext } from "./ServiceContext";
import * as React from "react";

jest.mock("./axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "mocked-token",
}));

describe("CqlLibraryReviewServiceApi", () => {
  const mockBaseUrl = "http://localhost/api";
  const mockToken = "mocked-token";

  let api: CqlLibraryReviewServiceApi;
  let mockGetAccessToken: jest.Mock;

  const review: CqlLibraryReview = {
    id: "review-1",
    libraryId: "library-1",
    librarySetId: "set-1",
    status: ReviewStatus.READY_FOR_REVIEW,
    comment: "Reviewed",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessToken = jest.fn().mockReturnValue(mockToken);
    api = new CqlLibraryReviewServiceApi(mockBaseUrl, mockGetAccessToken);
  });

  it("creates a cql library review", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: review });

    const result = await api.createCqlLibraryReview("library-1", review);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/library-1/review`,
      review,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toEqual(review);
  });

  it("updates a cql library review", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: review });

    const result = await api.updateCqlLibraryReview("library-1", review);

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/library-1/review`,
      review,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toEqual(review);
  });

  it("fetches a cql library review", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: review });

    const result = await api.getCqlLibraryReview("library-1");

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/library-1/review`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toEqual(review);
  });

  it("returns null for 404 cql library review", async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });

    const result = await api.getCqlLibraryReview("library-1");

    expect(result).toBeNull();
  });

  it("rethrows non-404 errors when fetching cql library review", async () => {
    const error = { response: { status: 500 } };
    mockedAxios.get.mockRejectedValueOnce(error);

    await expect(api.getCqlLibraryReview("library-1")).rejects.toEqual(error);
  });

  it("fetches cql library reviews by set id", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [review] });

    const result = await api.getCqlLibraryReviewsByLibrarySetId("set-1");

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${mockBaseUrl}/cql-libraries/library-set/set-1/reviews`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      })
    );
    expect(result).toEqual([review]);
  });

  it("hook returns CqlLibraryReviewServiceApi instance", () => {
    const wrapper = ({ children }) =>
      React.createElement(
        ServiceContext.Provider,
        {
          value: {
            measureService: { baseUrl: mockBaseUrl },
            cqlLibraryService: { baseUrl: mockBaseUrl },
          },
        },
        children
      );

    const { result } = renderHook(() => useCqlLibraryReviewServiceApi(), {
      wrapper,
    });

    expect(result.current).toBeInstanceOf(CqlLibraryReviewServiceApi);
  });
});
