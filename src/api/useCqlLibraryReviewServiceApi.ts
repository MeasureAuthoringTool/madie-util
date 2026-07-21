import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import useOktaTokens from "../hooks/useOktaTokens";
import { CqlLibraryReview } from "@madie/madie-models";

export class CqlLibraryReviewServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async createCqlLibraryReview(
    libraryId: string,
    review: CqlLibraryReview
  ): Promise<CqlLibraryReview> {
    const response = await axios.post<CqlLibraryReview>(
      `${this.baseUrl}/cql-libraries/${libraryId}/review`,
      review,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
    return response.data;
  }

  async updateCqlLibraryReview(
    libraryId: string,
    review: CqlLibraryReview
  ): Promise<CqlLibraryReview> {
    const response = await axios.put<CqlLibraryReview>(
      `${this.baseUrl}/cql-libraries/${libraryId}/review`,
      review,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
    return response.data;
  }

  async getCqlLibraryReview(
    libraryId: string
  ): Promise<CqlLibraryReview | null> {
    try {
      const response = await axios.get<CqlLibraryReview>(
        `${this.baseUrl}/cql-libraries/${libraryId}/review`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getCqlLibraryReviewsByLibrarySetId(
    librarySetId: string
  ): Promise<CqlLibraryReview[]> {
    const response = await axios.get<CqlLibraryReview[]>(
      `${this.baseUrl}/cql-libraries/library-set/${librarySetId}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
    return response.data;
  }
}

export default function useCqlLibraryReviewServiceApi() {
  const { cqlLibraryService } = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = cqlLibraryService;
  return new CqlLibraryReviewServiceApi(baseUrl, getAccessToken);
}
