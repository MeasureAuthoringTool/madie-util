import axios from "axios";
import { ServiceConfig, getServiceConfig } from "../Config/Config";
import useOktaTokens from "../hooks/useOktaTokens";
import { Organization } from "@madie/madie-models";

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

export default function useOrganizationApi(): OrganizationApi {
  const { getAccessToken } = useOktaTokens();
  return new OrganizationApi(getAccessToken);
}
