import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import useOktaTokens from "../hooks/useOktaTokens";
import { AxiosResponse } from "axios";

import { CqlLibrary, OwnershipType } from "@madie/madie-models";

export type AuditRow = {
  actionType: string;
  additionalActionMessage: string;
  performedAt: string;
  performedBy: string;
};

export class CqlLibraryServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async fetchCqlLibraries(
    ownershipType: OwnershipType,
    limit: string | number = 25,
    page: number = 0,
    searchCriteria,
    sortInfo,
    signal
  ): Promise<any> {
    try {
      limit = limit === "All" ? 1000 : limit; // if limit is "All", set it to a high number to fetch all results
      const response = await axios.put<any>(
        `${this.baseUrl}/cql-libraries/searches`,
        searchCriteria,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            ownershipType,
            limit,
            page,
            sortInfo: sortInfo || undefined,
          },
          signal,
        }
      );
      return response.data;
    } catch (err) {
      if (err.message === "canceled") {
        throw new Error(err.message);
      }
      const message = `Unable to fetch Cql Libraries`;
      console.error(message);
      console.error(err);

      throw new Error(message);
    }
  }

  async fetchCqlLibrary(id: string): Promise<CqlLibrary> {
    try {
      const response = await axios.get<CqlLibrary>(
        `${this.baseUrl}/cql-libraries/${id}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to fetch cql library`;
      throw new Error(message);
    }
  }

  async createCqlLibrary(cqlLibrary: CqlLibrary): Promise<void> {
    return await axios.post(`${this.baseUrl}/cql-libraries`, cqlLibrary, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }

  async updateCqlLibrary(cqlLibrary: CqlLibrary): Promise<any> {
    return await axios.put(
      `${this.baseUrl}/cql-libraries/${cqlLibrary.id}`,
      cqlLibrary,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async createVersion(
    id: string,
    isMajor: boolean
  ): Promise<AxiosResponse<CqlLibrary>> {
    return await axios.put(
      `${this.baseUrl}/cql-libraries/version/${id}?isMajor=${isMajor}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async createDraft(
    cqlLibraryId: string,
    cqlLibraryName: string,
    model: string
  ): Promise<AxiosResponse<CqlLibrary>> {
    return await axios.post(
      `${this.baseUrl}/cql-libraries/draft/${cqlLibraryId}`,
      { cqlLibraryName: cqlLibraryName, model: model },
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async deleteDraft(id: string): Promise<AxiosResponse<CqlLibrary>> {
    return await axios.delete(`${this.baseUrl}/cql-libraries/${id}`, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }

  async fetchAllOwners(librarySetIds: string[]): Promise<any> {
    const idsParam = librarySetIds.join(",");
    try {
      const response = await axios.get<any>(
        `${this.baseUrl}/cql-libraries/getAllOwners`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            librarySetIds: idsParam,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to fetch library owners`;
      console.error(message, err);
      throw new Error(message);
    }
  }

  async getCqlDiff(oldLibraryId: string, newLibraryId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/cql-libraries/${oldLibraryId}/compare/${newLibraryId}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error("Failed to get CQL diff", err);
      throw err;
    }
  }

  async shareLibraries(libraries: Map<string, string[]>): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/cql-libraries/share`,
        Object.fromEntries(libraries),
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message =
        "Unable to share the selected libraries with the added users. If the error persists, please contact the help desk.";
      console.error(message, err);
      throw new Error(message);
    }
  }

  async getSharedLibraries(libraryIds: string[]): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/cql-libraries/shared?libraryIds=${libraryIds}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message =
        "Unable to retrieve users that the selected libraries is shared with. If the error persists, please contact the help desk.";
      console.error(message, err);
      throw new Error(message);
    }
  }

  async getRecentLibrariesByLibrarySetId(
    librarySetIds: string[]
  ): Promise<any> {
    const idsParam = librarySetIds.join(",");
    try {
      const response = await axios.get(
        `${this.baseUrl}/cql-libraries/recentsByLibrarySetId`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            librarySetIds: idsParam,
          },
        }
      );
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.error(
        "error requesting Libraries By multiple librarySetIds ",
        error
      );
      throw error;
    }
  }

  async unshareLibraries(
    libraryUserIdMap: Map<string, string[]>
  ): Promise<any> {
    {
      try {
        const response = await axios.put(
          `${this.baseUrl}/cql-libraries/unshare`,
          Object.fromEntries(libraryUserIdMap),
          {
            headers: {
              Authorization: `Bearer ${this.getAccessToken()}`,
            },
          }
        );
        return response.data;
      } catch (err) {
        console.error("Failed to unshare libraries", err);
        throw err;
      }
    }
  }

  async getLibrariesByLibrarySetId(
    librarySetId: string,
    sortByLatestVersion?: boolean,
    librarySearchCriteria?: any
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/cql-libraries/byLibrarySetId`,
        librarySearchCriteria,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            librarySetId: librarySetId,
            sortByLatestVersion: sortByLatestVersion,
          },
        }
      );
      if (response.data) {
        return response.data;
      }
    } catch (err) {
      console.error("Failed to get libraries by library set id ", err);
      throw err;
    }
  }

  async getLibraryHistory(selectedLibrary: CqlLibrary): Promise<AuditRow[]> {
    const { id } = selectedLibrary;
    try {
      const response = await axios.get<AuditRow[]>(
        `${this.baseUrl}/cql-libraries/${id}/history`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch library history");
    }
  }

  async lockLibrary(libraryId: string): Promise<any> {
    try {
      const response = await axios.put<String>(
        `${this.baseUrl}/cql-libraries/${libraryId}/lock`,
        {},
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

  async unlockLibrary(libraryId: string): Promise<any> {
    try {
      const response = await axios.delete<String>(
        `${this.baseUrl}/cql-libraries/${libraryId}/lock`,
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

  async transferLibraries(
    libraryIds: Array<string>,
    harpId: string,
    retainShareAccess: boolean
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/cql-libraries/transfer`,
        libraryIds,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            harpId: `${harpId}`,
          },
          params: {
            retainShareAccess,
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to transfer libraries", error);
      throw error;
    }
  }

  async unlockLibraries(): Promise<String> {
    try {
      const response = await axios.delete<String>(
        `${this.baseUrl}/cql-libraries/unlock`,
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

  async getSharedAccessReportForLibraries(ids: Array<string>): Promise<Blob> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/cql-libraries/admin/shared-access-report`,
        ids,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          responseType: "blob",
        }
      );
      return response.data;
    } catch (err) {
      console.error("Failed to export library access report", err);
      throw err;
    }
  }
}

export default function useCqlLibraryServiceApi() {
  const { cqlLibraryService } = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = cqlLibraryService;
  return new CqlLibraryServiceApi(baseUrl, getAccessToken);
}
