import { act, renderHook } from "@testing-library/react-hooks";
import useReviewComments, {
  COMMENT_NOT_FOUND_ERROR,
  COMMENT_SAVE_ERROR,
  REVIEW_LOAD_ERROR,
} from "./useReviewComments";

const mockMeasureApi = {
  getMeasureReview: jest.fn(),
  updateMeasureReview: jest.fn(),
};
const mockLibraryApi = {
  getCqlLibraryReview: jest.fn(),
  updateCqlLibraryReview: jest.fn(),
};

jest.mock("../api/useMeasureReviewServiceApi", () => () => mockMeasureApi);
jest.mock("../api/useCqlLibraryReviewServiceApi", () => () => mockLibraryApi);

const existing = {
  id: "c1",
  mainSection: "Details",
  subSection: "Description",
  authorName: "User2",
  createdAt: "2025-06-18T10:42:00.000Z",
  content: "<p>first</p>",
};

const measureReview = {
  id: "r1",
  measureId: "m1",
  measureSetId: "s1",
  status: "READY_FOR_REVIEW",
  reviewers: ["reviewer"],
  comments: [existing],
};

describe("useReviewComments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMeasureApi.getMeasureReview.mockResolvedValue(measureReview);
    mockMeasureApi.updateMeasureReview.mockImplementation((_id, review) =>
      Promise.resolve(review)
    );
    mockLibraryApi.getCqlLibraryReview.mockResolvedValue(null);
  });

  it("loads the measure review and exposes its comments", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useReviewComments("measure", "m1")
    );
    await waitForNextUpdate();

    expect(mockMeasureApi.getMeasureReview).toHaveBeenCalledWith("m1");
    expect(result.current.review).toEqual(measureReview);
    expect(result.current.comments).toEqual([existing]);
  });

  it("uses the library api for a library", async () => {
    const libraryReview = { id: "r2", libraryId: "l1", comments: [] };
    mockLibraryApi.getCqlLibraryReview.mockResolvedValue(libraryReview);

    const { result, waitForNextUpdate } = renderHook(() =>
      useReviewComments("library", "l1")
    );
    await waitForNextUpdate();

    expect(mockLibraryApi.getCqlLibraryReview).toHaveBeenCalledWith("l1");
    expect(mockMeasureApi.getMeasureReview).not.toHaveBeenCalled();
    expect(result.current.review).toEqual(libraryReview);
  });

  it("does not fetch without an entity id", () => {
    const { result } = renderHook(() =>
      useReviewComments("measure", undefined)
    );

    expect(mockMeasureApi.getMeasureReview).not.toHaveBeenCalled();
    expect(result.current.review).toBeNull();
    expect(result.current.comments).toEqual([]);
  });

  it("adds a comment by sending the whole review back", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useReviewComments("measure", "m1")
    );
    await waitForNextUpdate();

    const added = { ...existing, id: "c2", content: "<p>second</p>" };
    await act(() => result.current.addComment(added));

    expect(mockMeasureApi.updateMeasureReview).toHaveBeenCalledWith("m1", {
      ...measureReview,
      comments: [existing, added],
    });
    expect(result.current.comments).toEqual([existing, added]);
  });

  it("updates and deletes a comment by id", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useReviewComments("measure", "m1")
    );
    await waitForNextUpdate();

    const edited = { ...existing, content: "<p>edited</p>", edited: true };
    await act(() => result.current.updateComment(edited));
    expect(result.current.comments).toEqual([edited]);

    await act(() => result.current.deleteComment(edited));
    expect(result.current.comments).toEqual([]);
    expect(mockMeasureApi.updateMeasureReview).toHaveBeenLastCalledWith("m1", {
      ...measureReview,
      comments: [],
    });
  });

  it("never treats comments without an id as the same comment", async () => {
    const [first, second] = [
      { ...existing, id: undefined, content: "<p>first</p>" },
      { ...existing, id: undefined, content: "<p>second</p>" },
    ];
    mockMeasureApi.getMeasureReview.mockResolvedValue({
      ...measureReview,
      comments: [first, second],
    });
    const { result, waitForNextUpdate } = renderHook(() =>
      useReviewComments("measure", "m1")
    );
    await waitForNextUpdate();

    await act(() =>
      result.current.updateComment({ ...first, content: "<p>edited</p>" })
    );
    expect(result.current.comments).toEqual([first, second]);

    await act(() => result.current.deleteComment(first));
    expect(result.current.comments).toEqual([first, second]);
  });

  it("does not write when there is no review to write to", async () => {
    mockMeasureApi.getMeasureReview.mockResolvedValue(null);
    const { result } = renderHook(() => useReviewComments("measure", "m1"));
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockMeasureApi.getMeasureReview).toHaveBeenCalledWith("m1");

    await act(() => result.current.addComment(existing));

    expect(mockMeasureApi.updateMeasureReview).not.toHaveBeenCalled();
  });

  it("reports a load failure instead of treating it as no review", async () => {
    mockMeasureApi.getMeasureReview.mockRejectedValue(new Error("boom"));
    const onError = jest.fn();

    const { result, waitFor } = renderHook(() =>
      useReviewComments("measure", "m1", onError)
    );
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(REVIEW_LOAD_ERROR)
    );

    expect(result.current.review).toBeNull();
  });

  it("reports a save failure and keeps the previous comments", async () => {
    mockMeasureApi.updateMeasureReview.mockRejectedValue(new Error("boom"));
    const onError = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() =>
      useReviewComments("measure", "m1", onError)
    );
    await waitForNextUpdate();

    let saved: boolean;
    await act(async () => {
      saved = await result.current.deleteComment(existing);
    });

    expect(saved).toBe(false);
    expect(onError).toHaveBeenCalledWith(COMMENT_SAVE_ERROR);
    expect(result.current.comments).toEqual([existing]);
  });

  it("resolves true once the comments are saved", async () => {
    mockMeasureApi.updateMeasureReview.mockResolvedValue({
      ...measureReview,
      comments: [],
    });
    const { result, waitForNextUpdate } = renderHook(() =>
      useReviewComments("measure", "m1")
    );
    await waitForNextUpdate();

    let saved: boolean;
    await act(async () => {
      saved = await result.current.deleteComment(existing);
    });

    expect(saved).toBe(true);
    expect(result.current.comments).toEqual([]);
  });

  it("takes the review broadcast by the review dialogs", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useReviewComments("measure", "m1")
    );
    await waitForNextUpdate();

    const saved = { ...measureReview, status: "IN_PROGRESS" };
    act(() => {
      window.dispatchEvent(
        new CustomEvent("review-measure-saved", { detail: saved })
      );
    });

    expect(result.current.review).toEqual(saved);
  });

  describe("saving from the latest review", () => {
    const theirs = {
      ...existing,
      id: "c9",
      authorName: "User3",
      content: "<p>added by another user after the page loaded</p>",
    };
    const reply = (id: string, content: string) => ({
      id,
      authorName: "User2",
      createdAt: "2025-06-19T10:00:00.000Z",
      content,
    });

    const loadThenServe = async (latestReview: any) => {
      const hook = renderHook(() => useReviewComments("measure", "m1"));
      await hook.waitForNextUpdate();
      mockMeasureApi.getMeasureReview.mockResolvedValue(latestReview);
      return hook.result;
    };

    it("keeps comments and review details other users saved since the page loaded", async () => {
      const latest = {
        ...measureReview,
        status: "IN_PROGRESS",
        comments: [existing, theirs],
      };
      const result = await loadThenServe(latest);

      const mine = { ...existing, id: undefined, content: "<p>mine</p>" };
      await act(() => result.current.addComment(mine));

      expect(mockMeasureApi.updateMeasureReview).toHaveBeenCalledWith("m1", {
        ...latest,
        comments: [existing, theirs, mine],
      });
      expect(result.current.comments).toEqual([existing, theirs, mine]);
    });

    it("edits a comment's own fields and keeps the latest replies", async () => {
      const latestReply = reply("r1", "<p>newer reply</p>");
      const result = await loadThenServe({
        ...measureReview,
        comments: [{ ...existing, replies: [latestReply] }],
      });

      await act(() =>
        result.current.updateComment({
          ...existing,
          content: "<p>edited</p>",
          edited: true,
          replies: [],
        })
      );

      expect(result.current.comments).toEqual([
        {
          ...existing,
          content: "<p>edited</p>",
          edited: true,
          replies: [latestReply],
        },
      ]);
    });

    it("adds a reply next to replies other users saved meanwhile", async () => {
      const theirReply = reply("r1", "<p>their reply</p>");
      const result = await loadThenServe({
        ...measureReview,
        comments: [{ ...existing, replies: [theirReply] }],
      });

      const myReply = { ...reply(undefined, "<p>my reply</p>") };
      await act(() => result.current.addReply(existing, myReply));

      expect(result.current.comments[0].replies).toEqual([theirReply, myReply]);
    });

    it("updates and deletes only the reply it is given", async () => {
      const [first, second] = [
        reply("r1", "<p>first</p>"),
        reply("r2", "<p>second</p>"),
      ];
      const result = await loadThenServe({
        ...measureReview,
        comments: [{ ...existing, replies: [first, second] }],
      });

      const edited = { ...first, content: "<p>edited</p>", edited: true };
      await act(() => result.current.updateReply(existing, edited));
      expect(result.current.comments[0].replies).toEqual([edited, second]);

      mockMeasureApi.getMeasureReview.mockResolvedValue(result.current.review);
      await act(() => result.current.deleteReply(existing, second));
      expect(result.current.comments[0].replies).toEqual([edited]);
    });

    it("does not save a reply to a comment that was deleted meanwhile", async () => {
      const onError = jest.fn();
      const hook = renderHook(() =>
        useReviewComments("measure", "m1", onError)
      );
      await hook.waitForNextUpdate();
      mockMeasureApi.getMeasureReview.mockResolvedValue({
        ...measureReview,
        comments: [],
      });

      let saved: boolean;
      await act(async () => {
        saved = await hook.result.current.addReply(
          existing,
          reply(undefined, "<p>too late</p>")
        );
      });

      expect(saved).toBe(false);
      expect(mockMeasureApi.updateMeasureReview).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(COMMENT_NOT_FOUND_ERROR);
      expect(hook.result.current.comments).toEqual([]);
    });
  });

  describe("reloading the review", () => {
    const theirs = {
      ...existing,
      id: "c9",
      content: "<p>added by another user</p>",
    };

    it("shows comments other users saved since the page loaded", async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useReviewComments("measure", "m1")
      );
      await waitForNextUpdate();
      mockMeasureApi.getMeasureReview.mockResolvedValue({
        ...measureReview,
        comments: [existing, theirs],
      });

      await act(() => result.current.reloadReview());

      expect(result.current.comments).toEqual([existing, theirs]);
    });

    it("ignores a reload that finishes after a newer save", async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useReviewComments("measure", "m1")
      );
      await waitForNextUpdate();

      let finishReload: (review: any) => void;
      mockMeasureApi.getMeasureReview.mockReturnValueOnce(
        new Promise((resolve) => {
          finishReload = resolve;
        })
      );
      let reload: Promise<void>;
      act(() => {
        reload = result.current.reloadReview();
      });

      const added = { ...existing, id: "c2", content: "<p>second</p>" };
      await act(() => result.current.addComment(added));
      expect(result.current.comments).toEqual([existing, added]);

      await act(async () => {
        finishReload(measureReview);
        await reload;
      });

      expect(result.current.comments).toEqual([existing, added]);
    });

    it("keeps the loaded comments and reports a failed reload", async () => {
      const onError = jest.fn();
      const { result, waitForNextUpdate } = renderHook(() =>
        useReviewComments("measure", "m1", onError)
      );
      await waitForNextUpdate();
      mockMeasureApi.getMeasureReview.mockRejectedValue(new Error("boom"));

      await act(() => result.current.reloadReview());

      expect(onError).toHaveBeenCalledWith(REVIEW_LOAD_ERROR);
      expect(result.current.comments).toEqual([existing]);
    });
  });
});
