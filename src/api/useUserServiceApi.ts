import axios from "../api/axios-instance";
import useServiceConfig from "./useServiceConfig";
import useOktaTokens from "../hooks/useOktaTokens";
import { UserDetails, UserLogin } from "@madie/madie-models";
import { userRolesStore } from "../Store/userRolesStore";

export class UserServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getOwnerDetails(harpId: string): Promise<UserDetails> {
    try {
      const response = await axios.get<any>(
        `${this.baseUrl}/users/${harpId}/details`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error("Unable to retrieve the owner", err);
      throw err;
    }
  }

  async getBulkUserDetails(
    harpIds: string[]
  ): Promise<Record<string, UserDetails>> {
    try {
      const response = await axios.post<Record<string, UserDetails>>(
        `${this.baseUrl}/users/details`,
        { harpIds },
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = "Unable to retrieve users details, please try later.";
      throw new Error(message);
    }
  }

  async loginUser(accessTokenObj: any): Promise<UserLogin> {
    if (!accessTokenObj || !accessTokenObj.claims) {
      throw new Error("No access token available for user login.");
    }
    try {
      const userName = accessTokenObj.claims.sub;
      const response = await axios.put<any>(
        `${this.baseUrl}/users/${userName}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessTokenObj.accessToken}`,
          },
        }
      );

      // Update the user roles store with the roles from the login response
      if (response.data?.roles) {
        const roleNames = response.data.roles.map(
          (r: { role: string }) => r.role
        );
        userRolesStore.updateUserRoles(roleNames);
      }

      return response.data;
    } catch (err) {
      const message = "Unable to login user, please try later.";
      throw new Error(message);
    }
  }

  // Todo This is never called and should be removed. The user roles are now being set during login and stored in the userRolesStore.
  //  If we need to fetch user roles separately in the future, we can implement a new API method for that.
  async fetchUserRoles(): Promise<string[]> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        return [];
      }

      // Extract harpId from the token
      const tokenParts = accessToken.split(".");
      if (tokenParts.length !== 3) {
        return [];
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const harpId = payload.sub;

      const response = await axios.get<{ harpId: string; roles: string[] }>(
        `${this.baseUrl}/users/${harpId}/roles`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const roleNames = response.data?.roles ?? [];

      userRolesStore.updateUserRoles(roleNames);
      return roleNames;
    } catch (err) {
      console.error("Error fetching user roles:", err);
      return [];
    }
  }

  async getUser(harpId: string, signal?: AbortSignal): Promise<UserDetails> {
    try {
      const response = await axios.get<UserDetails>(
        `${this.baseUrl}/users/${harpId}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          signal,
        }
      );
      return response.data;
    } catch (err) {
      console.error("Unable to retrieve user:", err);
      throw err;
    }
  }

  async fetchUsers(signal?: AbortSignal): Promise<UserDetails[]> {
    try {
      const response = await axios.get<UserDetails[]>(`${this.baseUrl}/users`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        signal,
      });
      return response.data ?? [];
    } catch (err) {
      console.error("Unable to retrieve users:", err);
      throw err;
    }
  }
}

export default function useUserServiceApi(): UserServiceApi {
  const { userService } = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = userService!;
  return new UserServiceApi(baseUrl, getAccessToken);
}
