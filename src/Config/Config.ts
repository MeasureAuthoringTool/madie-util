import axios from "../api/axios-instance";
import { ServiceConfig, OktaConfig } from "../api/ServiceContext";

interface OktaEnvConfig {
  baseUrl: string;
  issuerUrl: string;
  clientId: string;
  scopes: string[];
  useClassicEngine: boolean;
}

export async function getServiceConfig(): Promise<ServiceConfig> {
  try {
    const res = await axios.get<ServiceConfig>(
      "/env-config/serviceConfig.json"
    );
    if (!res?.data) {
      throw new Error("Service Config not found");
    }
    return res.data;
  } catch (err) {
    console.warn("An error occurred while loading the service config: ", err);
    throw new Error("Invalid Service Config");
  }
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
