import axios from "../api/axios-instance";
import useOktaTokens from "../hooks/useOktaTokens";
import { Organization } from "@madie/madie-models";
import { wafIntercept } from "../madie-madie-util";
import useServiceConfig from "./useServiceConfig";

export class OrganizationApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getAllOrganizations(): Promise<Organization[]> {
    try {
      const response = await axios.get<Organization[]>(
        `${this.baseUrl}/organizations`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      if (response?.data.length < 1) {
        throw new Error("Organizations list is empty");
      }
      return response?.data;
    } catch (err) {
      const msg = "Unable to fetch organizations: " + err.message;
      throw new Error(msg);
    }
  }
}

axios.interceptors.response.use((response) => {
  return response;
}, wafIntercept);

export default function useOrganizationApi(): OrganizationApi {
  const { measureService } = useServiceConfig();
  const { baseUrl } = measureService;
  const { getAccessToken } = useOktaTokens();
  return new OrganizationApi(baseUrl, getAccessToken);
}
