import axios from "../api/axios-instance";
import { ServiceConfig } from "../api/ServiceContext";

export interface OktaConfig {
  baseUrl: string;
  issuer: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  useClassicEngine: boolean;
}

interface OktaEnvConfig {
  baseUrl: string;
  issuerUrl: string;
  clientId: string;
  scopes: string[];
  useClassicEngine: boolean;
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

  return serviceConfig;
}

export async function getOktaConfig(): Promise<OktaConfig> {
  const oktaEnvConfig: OktaEnvConfig = (
    await axios.get<OktaEnvConfig>("/env-config/oktaConfig.json")
  ).data;

  if (
    !oktaEnvConfig.baseUrl ||
    !oktaEnvConfig.issuerUrl ||
    !oktaEnvConfig.clientId
  ) {
    throw new Error("Invalid oktaEnvConfig variables");
  }

  return {
    baseUrl: `${oktaEnvConfig.baseUrl}`,
    issuer: `${oktaEnvConfig.issuerUrl}`,
    clientId: `${oktaEnvConfig.clientId}`,
    redirectUri: window.location.origin + "/login/callback",
    scopes: oktaEnvConfig.scopes,
    useClassicEngine: oktaEnvConfig.useClassicEngine || false,
  };
}
