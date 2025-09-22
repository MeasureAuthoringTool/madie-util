import axios from "../api/axios-instance";
import useOktaTokens from "../hooks/useOktaTokens";
import { wafIntercept } from "../madie-madie-util";
import useServiceConfig from "./useServiceConfig";

export class TerminologyServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async checkLogin(): Promise<Boolean> {
    try {
      const resp = await axios.get(
        `${this.baseUrl}/vsac/umls-credentials/status`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Content-Type": "text/plain",
          },
          timeout: 15000,
        }
      );
      return resp.status === 200;
    } catch (error) {
      throw error;
    }
  }

  async loginUMLS(apiKey: string): Promise<String> {
    try {
      const resp = await axios.post(
        `${this.baseUrl}/vsac/umls-credentials`,
        apiKey,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Content-Type": "text/plain",
          },
          timeout: 15000,
        }
      );
      if (resp.status === 200) {
        return "status: " + resp.status + " response: " + resp.data;
      }
      return "failure";
    } catch (error) {
      throw error;
    }
  }

  async logoutUMLS(): Promise<Boolean> {
    try {
      const resp = await axios.delete(`${this.baseUrl}/vsac/umls-credentials`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
          "Content-Type": "text/plain",
        },
        timeout: 15000,
      });
      return resp.status === 200;
    } catch (error) {
      console.error("UMLS Logout failed:", error);
      throw error;
    }
  }
}

axios.interceptors.response.use((response) => {
  return response;
}, wafIntercept);

export default function useTerminologyServiceApi(): TerminologyServiceApi {
  const { terminologyService } = useServiceConfig();
  const { baseUrl } = terminologyService;
  const { getAccessToken } = useOktaTokens();
  return new TerminologyServiceApi(baseUrl, getAccessToken);
}
