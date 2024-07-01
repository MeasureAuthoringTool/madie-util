import axios from "axios";
import { wafIntercept } from "../madie-madie-util";

export interface OktaConfig {
  baseUrl: string;
  issuer: string;
  clientId: string;
  redirectUri: string;
}

export interface ServiceConfig {
  measureService: {
    baseUrl: string;
  };
  elmTranslationService: {
    baseUrl: string;
  };
  terminologyService: {
    baseUrl: string;
  };
  madieVersion: string;
  features: {
    export: boolean;
  };
}

export async function getServiceConfig(): Promise<ServiceConfig> {
  const serviceConfig: ServiceConfig = (
    await axios.get<ServiceConfig>("/env-config/serviceConfig.json")
  ).data;
  if (
    !(serviceConfig?.measureService && serviceConfig.measureService.baseUrl)
  ) {
    throw new Error("Invalid Service Config");
  }
  axios.interceptors.response.use((response) => {
    return response;
  }, wafIntercept);

  return serviceConfig;
}
