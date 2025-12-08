import { AxiosResponse } from "axios";
import axios from "../api/axios-instance";
import useServiceConfig from "./useServiceConfig";
import useOktaTokens from "../hooks/useOktaTokens";

export class UserServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getMeasureOwnerDetails(harpId: string) {
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
}

export default function useUserServiceApi(): UserServiceApi {
  const { userService } = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = userService!;
  return new UserServiceApi(baseUrl, getAccessToken);
}
