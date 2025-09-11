import axiosReal from "axios";
import wafIntercept from "../util/wafIntercept";

const axios = axiosReal.create();
if (axios && axios.interceptors && axios.interceptors.response) {
  axios.interceptors.response.use((response) => {
    return response;
  }, wafIntercept);
}

export default axios;
