import axios from "../api/axios-instance";
import { getServiceConfig } from "../Config/Config";
import { ServiceConfig } from "./ServiceContext";
import useOktaTokens from "../hooks/useOktaTokens";
import { Organization } from "@madie/madie-models";
import { wafIntercept } from "../madie-madie-util";

export class OrganizationApi {
  constructor(private getAccessToken: () => string) {}

  async getAllOrganizations(): Promise<Organization[]> {
    const baseUrl = await getServiceUrl();
    try {
      const response = await axios.get<Organization[]>(
        `${baseUrl}/organizations`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      if (response?.data.length < 1) {
        throw new Error("Empty list");
      }
      return response?.data;
    } catch (err) {
      const msg = "Unable to fetch organizations: " + err.message;
      throw new Error(msg);
    }
  }
}

export const getServiceUrl = async () => {
  const config: ServiceConfig = await getServiceConfig();
  const serviceUrl: string = config?.measureService?.baseUrl;

  return serviceUrl;
};

axios.interceptors.response.use((response) => {
  return response;
}, wafIntercept);

export default function useOrganizationApi(): OrganizationApi {
  const { getAccessToken } = useOktaTokens();
  return new OrganizationApi(getAccessToken);
}
