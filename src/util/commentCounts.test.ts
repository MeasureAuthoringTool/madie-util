import { Comment } from "@madie/madie-models";
import { countComments, countCommentThread } from "./commentCounts";

const comment = (id: string, replies?: Comment[]): Comment =>
  ({ id, replies } as Comment);

describe("commentCounts", () => {
  it("counts nothing as zero", () => {
    expect(countComments(undefined)).toBe(0);
    expect(countComments([])).toBe(0);
  });

  it("counts a thread as the comment plus its replies", () => {
    expect(countCommentThread(comment("a"))).toBe(1);
    expect(
      countCommentThread(comment("a", [comment("r1"), comment("r2")]))
    ).toBe(3);
  });

  it("totals comments and replies across threads", () => {
    expect(
      countComments([
        comment("a", [comment("r1"), comment("r2")]),
        comment("b"),
        comment("c", []),
      ])
    ).toBe(5);
  });
});
