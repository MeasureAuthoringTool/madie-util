import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import {
  Measure,
  Group,
  Organization,
  EndorsementOrganization,
  MeasureSet,
  OwnershipType,
  MeasureSearchCriteria,
} from "@madie/madie-models";
import useOktaTokens from "../hooks/useOktaTokens";
import _ from "lodash";

import qs from "qs";

export class MeasureServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async unlockMeasures(): Promise<String> {
    try {
      const response = await axios.delete<String>(
        `${this.baseUrl}/measures/unlock`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  }
}

export default async function useMeasureServiceApi(): Promise<MeasureServiceApi> {
  const serviceConfig: ServiceConfig = await useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.measureService;
  return new MeasureServiceApi(baseUrl, getAccessToken);
}
