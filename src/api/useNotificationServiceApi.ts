import axios from "../api/axios-instance";
import useServiceConfig from "./useServiceConfig";
import useOktaTokens from "../hooks/useOktaTokens";

export class UseNotificationServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getAllNotifications(): Promise<any> {
    try {
        console.log(`${this.baseUrl}/notifications`)
      const response = await axios.get<any>(
        `${this.baseUrl}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      throw new Error("Unable to retrieve notifications, please try later.");
    }
  }
  async readOneNotification(notificationID: string): Promise<any> {
    try {
      const response = await axios.put<any>(
        `${this.baseUrl}/notifications/${notificationID}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      throw new Error("Unable to mark notification as read, please try later.");
    }
}
async deleteNotification(notificationID: string): Promise<any> {
    try {
      const response = await axios.delete<any>(
        `${this.baseUrl}/notifications/${notificationID}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      throw new Error("Unable to delete notification, please try later.");
    }
  }

  async readAllNotifications(notificationIDs: string[]): Promise<any> {
    try {
      const response = await axios.put<any>(
        `${this.baseUrl}/notifications/read`,
        { notificationIDs },
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      throw new Error("Unable to mark notifications as read, please try later.");
    }
  }

}

export default function useUserServiceApi(): UseNotificationServiceApi {
  const { notificationService } = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = notificationService!;
  return new UseNotificationServiceApi(baseUrl, getAccessToken);
}
