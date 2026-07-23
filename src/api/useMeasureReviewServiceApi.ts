import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import useOktaTokens from "../hooks/useOktaTokens";
import { MeasureReview } from "@madie/madie-models";

export class MeasureReviewServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async createMeasureReview(
    measureId: string,
    review: MeasureReview
  ): Promise<MeasureReview> {
    const response = await axios.post<MeasureReview>(
      `${this.baseUrl}/measures/${measureId}/review`,
      review,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
    return response.data;
  }

  async updateMeasureReview(
    measureId: string,
    review: MeasureReview
  ): Promise<MeasureReview> {
    const response = await axios.put<MeasureReview>(
      `${this.baseUrl}/measures/${measureId}/review`,
      review,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
    return response.data;
  }

  async getMeasureReview(measureId: string): Promise<MeasureReview | null> {
    try {
      const response = await axios.get<MeasureReview>(
        `${this.baseUrl}/measures/${measureId}/review`,
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

  async getMeasureReviewsByMeasureSetId(
    measureSetId: string
  ): Promise<MeasureReview[]> {
    const response = await axios.get<MeasureReview[]>(
      `${this.baseUrl}/measures/measure-set/${measureSetId}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
    return response.data;
  }
}

export default function useMeasureReviewServiceApi(): MeasureReviewServiceApi {
  const { measureService } = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = measureService;
  return new MeasureReviewServiceApi(baseUrl, getAccessToken);
}
