import axios from "../api/axios-instance";
import useOktaTokens from "../hooks/useOktaTokens";
import { wafIntercept } from "../madie-madie-util";
import useServiceConfig from "./useServiceConfig";
import { CqlCode, CqlCodeSystem } from "@madie/cql-antlr-parser/dist/src";

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
}

// customCqlCode contains validation result from VSAC
// This object can be cached in future, to avoid calling VSAC everytime.
export interface CustomCqlCodeSystem extends CqlCodeSystem {
  valid?: boolean;
  errorMessage?: string;
}
export interface CustomCqlCode extends Omit<CqlCode, "codeSystem"> {
  codeSystem: CustomCqlCodeSystem;
  valid?: boolean;
  errorMessage?: string;
}
export type ValueSet = {
  resourceType: string;
  id: string;
  url: string;
  status: string;
  errorMsg: string;
};

export interface AddValueSetForAdmin {
  url: string;
  version?: string;
  lastUpdated: string;
  manuallyModified: boolean;
  valueSet: string;
}
export interface ValueSetDisplayForAdmin {
  id: string;
  url: string;
  version?: string;
  lastUpdated: string;
  manuallyModified: boolean;
  valueSet: string;
}

export interface ValueSetDisplayForAdmin {
  id: string;
  url: string;
  version?: string;
  lastUpdated: string;
  manuallyModified: boolean;
  valueSet: string;
}

export interface UpdateValueSetForAdmin extends AddValueSetForAdmin {
  id: string;
}

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

  async getValueSets(
    page = 0,
    limit = 10,
    sortInfo?: string,
    searchTerm?: string
  ): Promise<Page<ValueSetDisplayForAdmin>> {
    const params: Record<string, string | number> = {
      page,
      limit,
    };

    if (sortInfo) {
      params.sortInfo = sortInfo;
    }

    if (searchTerm) {
      params.searchTerm = searchTerm;
    }

    const response = await axios.get(
      `${this.baseUrl}/terminology/admin/valuesets`,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        params,
      }
    );

    return response.data;
  }
  async validateCodes(
    customCqlCodes: CustomCqlCode[],
    loggedInUMLS: boolean,
    model: string
  ): Promise<CustomCqlCode[]> {
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

  async deleteValueSet(id: string): Promise<Response> {
    return await axios.delete(
      `${this.baseUrl}/terminology/admin/value-set/${id}`,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }
  async updateValueSet(
    valueSet: UpdateValueSetForAdmin
  ): Promise<ValueSetDisplayForAdmin> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/terminology/admin/value-set`,
        valueSet,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      const apiValidationError =
        error.response?.data?.validationErrors?.["/api"];
      if (apiValidationError) {
        throw new Error(apiValidationError);
      }

      let message =
        "An error occurred while updating the value set. Please try again. If the error persists, please contact the help desk.";

      if (error.response?.data?.message) {
        message = `${message}: ${error.response.data.message}`;
      }

      throw new Error(message);
    }
  }

  async addValueSet(
    valueSet: AddValueSetForAdmin
  ): Promise<ValueSetDisplayForAdmin> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/terminology/admin/value-set`,
        valueSet,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      const apiValidationError =
        error.response?.data?.validationErrors?.["/api"];
      if (apiValidationError) {
        throw new Error(apiValidationError);
      }

      let message =
        "An error occurred while adding the value set. Please try again. If the error persists, please contact the help desk.";

      if (error.response?.data?.message) {
        message = `${message}: ${error.response.data.message}`;
      }

      throw new Error(message);
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
  cqlCodes: CustomCqlCode[],
  errorMessage: string,
  valid: boolean
): CustomCqlCode[] => {
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
