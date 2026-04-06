import axios from "../api/axios-instance";
import useServiceConfig from "./useServiceConfig";
import useOktaTokens from "../hooks/useOktaTokens";

export class UseNotificationServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getAllNotifications(): Promise<any> {
    try {
      console.log(`${this.baseUrl}/notifications`);
      const response = await axios.get<any>(`${this.baseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      });
      return response.data;
    } catch (err) {
      throw new Error("Unable to retrieve notifications, please try later.");
    }
  }

  // create a list of notifications (admin use case)
  async createNotifications(notifications: any[]): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/notifications`,
        notifications,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (err) {
      throw new Error("Unable to create notifications, please try later.");
    }
  }

  // send a list of notifications to be marked as seen when the dropdown is opened.
  async markNotificationsSeen(ids: string[]): Promise<void> {
    try {
      await axios.patch(`${this.baseUrl}/notifications/mark-seen`, ids, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      throw new Error(
        "Unable to mark notifications as seen, please try later."
      );
    }
  }

  async readOneNotification(notificationID: string): Promise<any> {
    try {
      await axios.patch(
        `${this.baseUrl}/notifications/mark-read/${notificationID}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
    } catch (err) {
      throw new Error("Unable to mark notification as read, please try later.");
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      });
    } catch (err) {
      throw new Error("Unable to delete notification, please try later.");
    }
  }
}

export default function useUserServiceApi(): UseNotificationServiceApi {
  const { notificationService } = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = notificationService!;
  return new UseNotificationServiceApi(baseUrl, getAccessToken);
}
