import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import useOktaTokens from "../hooks/useOktaTokens";
export class CqlLibraryServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async unlockLibraries(): Promise<String> {
    try {
      const response = await axios.delete<String>(
        `${this.baseUrl}/libraries/unlock`,
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

export default async function useCqlLibraryServiceApi() {
  const serviceConfig: ServiceConfig = await useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.cqlLibraryService;
  return new CqlLibraryServiceApi(baseUrl, getAccessToken);
}
