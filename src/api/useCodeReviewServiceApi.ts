import axios from "../api/axios-instance";
import useServiceConfig from "./useServiceConfig";
import useOktaTokens from "../hooks/useOktaTokens";

// ─── Domain Types ──────────────────────────────────────────────────────────────

export interface CommentReply {
  id: string;
  author?: string;
  text: string;
  createdAt?: string;
}

export interface CodeReviewComment {
  id?: string; // MongoDB ObjectId — assigned by backend
  commentId: string; // UI-generated identifier, e.g. "cql-editor-..."
  commentType: string;
  measureId: string;
  lineNumber: number;
  lineContent: string;
  author?: string;
  text: string;
  createdAt?: string;
  replies: CommentReply[];
  resolved: boolean;
}

export interface CreateCommentPayload {
  commentId: string; // UI-generated, prefixed with "cql-editor-"
  commentType: string;
  measureId: string;
  lineNumber: number;
  lineContent: string;
  author?: string;
  text: string;
  replies: [];
  resolved: boolean;
}

export interface AddReplyPayload {
  id: string; // generated in UI
  text: string;
  author?: string;
}

// ─── API Class ─────────────────────────────────────────────────────────────────

export class CodeReviewServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  /**
   * GET /api/comments?measureId=<measureId>
   * Returns all comments for a given measure.
   */
  async getCommentsByMeasureId(
    measureId: string
  ): Promise<CodeReviewComment[]> {
    try {
      const response = await axios.get<CodeReviewComment[]>(
        `${this.baseUrl}/comments`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: { measureId },
        }
      );
      return response.data;
    } catch (err) {
      throw new Error(
        "Unable to retrieve code review comments, please try later."
      );
    }
  }

  /**
   * POST /api/comments
   * Creates a new comment. The id is generated in the UI and prefixed
   * with "cql-editor-" so the consumer can filter by origin page.
   */
  async createComment(
    payload: CreateCommentPayload
  ): Promise<CodeReviewComment> {
    try {
      const response = await axios.post<CodeReviewComment>(
        `${this.baseUrl}/comments`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (err) {
      throw new Error("Unable to create comment, please try later.");
    }
  }

  /**
   * PUT /api/comments/:commentId/replies
   * Appends a reply to an existing comment thread.
   */
  async addReply(
    commentId: string,
    payload: AddReplyPayload
  ): Promise<CodeReviewComment> {
    try {
      const response = await axios.put<CodeReviewComment>(
        `${this.baseUrl}/comments/${commentId}/replies`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (err) {
      throw new Error("Unable to add reply, please try later.");
    }
  }

  /**
   * DELETE /api/comments/:commentId
   * Deletes a comment. The backend enforces author-only deletion.
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      });
    } catch (err) {
      throw new Error("Unable to delete comment, please try later.");
    }
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export default function useCodeReviewServiceApi(): CodeReviewServiceApi {
  const { measureService } = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = measureService!;
  return new CodeReviewServiceApi(baseUrl, getAccessToken);
}
