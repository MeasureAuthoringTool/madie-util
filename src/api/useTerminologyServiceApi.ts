import axios from "../api/axios-instance";
import useOktaTokens from "../hooks/useOktaTokens";
import { wafIntercept } from "../madie-madie-util";
import useServiceConfig from "./useServiceConfig";

export type ValueSet = {
  resourceType: string;
  id: string;
  url: string;
  status: string;
  errorMsg: string;
};

export interface ValueSetSearchResult {
  resultBundle: string;
  valueSets: ValueSetForSearch[];
}

export interface ValueSetForSearch {
  codeSystem?: string;
  name?: string;
  author?: string;
  composedOf?: string;
  effectiveDate?: string;
  lastReviewDate?: string;
  lastUpdated?: string;
  publisher?: string;
  purpose?: string;
  oid?: string;
  status?: string;
  steward?: string;
  title?: string;
  url?: string;
  version?: string;
}

export class TerminologyServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getValueSet(
    oid: string,
    locator: string,
    loggedInUMLS: boolean
  ): Promise<ValueSet> {
    let valueset: ValueSet = null;
    if (!loggedInUMLS) {
      valueset = {
        resourceType: "ValueSet",
        id: oid,
        url: locator,
        status: "unauthorized",
        errorMsg: "Please log in to UMLS",
      };
      return valueset;
    }
    await axios
      .get(`${this.baseUrl}/vsac/valueset`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
          "Content-Type": "text/plain",
        },
        params: {
          oid: oid,
        },
        timeout: 15000,
      })
      .then((resp) => {
        valueset = resp.data;
      })
      .catch((error) => {
        const message =
          error.message + " for oid = " + oid + " location = " + locator;
        valueset = {
          resourceType: "ValueSet",
          id: oid,
          url: locator,
          status: error.status,
          errorMsg: message,
        };
      });
    return valueset;
  }

  async validateCodes(
    customCqlCodes: any[],
    loggedInUMLS: boolean,
    model: string
  ): Promise<any[]> {
    if (!loggedInUMLS) {
      return processCodeSystemErrors(
        customCqlCodes,
        "Please Login to UMLS",
        false
      );
    }
    try {
      const response = await axios.put(
        `${this.baseUrl}/vsac/validations/codes?model=${model}`,
        customCqlCodes,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      if (response.status === 200) {
        return response.data;
      } else {
        return processCodeSystemErrors(
          customCqlCodes,
          "Unable to validate code, Please contact HelpDesk",
          false
        );
      }
    } catch (err) {
      return processCodeSystemErrors(
        customCqlCodes,
        "Unable to validate code, Please contact HelpDesk",
        false
      );
    }
  }
  // https://cts.nlm.nih.gov/fhir/ValueSet?usage=VSAC$covid
  async searchValueSets(values): Promise<ValueSetSearchResult> {
    const keys = Object.keys(values);
    let qString = "?";
    for (let i = 0; i < keys.length; i++) {
      if (i !== 0) {
        qString = qString.concat("&");
      }
      const key = keys[i];
      const value = values[key];
      qString = qString.concat(`${key}=${value}`);
    }
    try {
      const response = await axios.get<ValueSetSearchResult>(
        `${this.baseUrl}/terminology/search-value-sets${qString}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error("Error retrieving getAllCodeSystems: ", err);
    }
  }

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

const processCodeSystemErrors = (
  cqlCodes: any[],
  errorMessage: string,
  valid: boolean
): any[] => {
  return cqlCodes.map((code) => {
    return {
      ...code,
      errorMessage: errorMessage,
      valid: valid,
      ...(code.codeSystem && {
        codeSystem: {
          ...code.codeSystem,
          errorMessage: errorMessage,
          valid: valid,
        },
      }),
    };
  });
};

axios.interceptors.response.use((response) => {
  return response;
}, wafIntercept);

export default function useTerminologyServiceApi(): TerminologyServiceApi {
  const { terminologyService } = useServiceConfig();
  const { baseUrl } = terminologyService;
  const { getAccessToken } = useOktaTokens();
  return new TerminologyServiceApi(baseUrl, getAccessToken);
}
