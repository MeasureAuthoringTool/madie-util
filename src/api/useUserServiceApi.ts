import axios from "../api/axios-instance";
import useServiceConfig from "./useServiceConfig";
import useOktaTokens from "../hooks/useOktaTokens";
import { UserDetails } from "@madie/madie-models";
import { userRolesStore } from "../Store/userRolesStore";

export interface UserLoginResponse {
  harpId: string;
  status: string;
  roles: Array<{ role: string; roleType: string }>;
}

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
      const message = "Unable to retrieve the owner, please try later.";
      throw new Error(message);
    }
  }

  async loginUser(
    accessToken: string | { accessToken: string }
  ): Promise<UserLoginResponse> {
    try {
      // Handle both string and object formats
      let tokenString: string;
      if (typeof accessToken === "string") {
        tokenString = accessToken;
      } else if (accessToken && typeof accessToken === "object") {
        tokenString = accessToken.accessToken;
      } else {
        throw new Error("Invalid accessToken type");
      }

      if (!tokenString) {
        throw new Error("Token string is empty");
      }

      // Extract username from the token claims
      const tokenParts = tokenString.split(".");
      if (tokenParts.length !== 3) {
        throw new Error("Invalid token format");
      }
      const payload = JSON.parse(atob(tokenParts[1]));
      const harpId = payload.sub;

      const response = await axios.put<UserLoginResponse>(
        `${this.baseUrl}/users/${harpId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenString}`,
          },
        }
      );

      // Update the user roles store with the roles from the login response
      if (response.data?.roles) {
        const roleNames = response.data.roles.map((r) => r.role);
        userRolesStore.updateUserRoles(roleNames);
      }

      return response.data;
    } catch (err) {
      throw err;
    }
  }

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

      const response = await axios.get<{ role: string; roleType: string }[]>(
        `${this.baseUrl}/users/${harpId}/roles`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const roleNames = response.data?.map((r) => r.role) ?? [];

      userRolesStore.updateUserRoles(roleNames);
      return roleNames;
    } catch (err) {
      return [];
    }
  }
}

export default function useUserServiceApi(): UserServiceApi {
  const { userService } = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = userService!;
  return new UserServiceApi(baseUrl, getAccessToken);
}
