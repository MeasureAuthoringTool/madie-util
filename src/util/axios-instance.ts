import axios from "axios";
import wafIntercept from "./wafIntercept";

export const axiosInstance = axios.create();
axiosInstance.interceptors.response.use((response) => {
  return response;
}, wafIntercept);
