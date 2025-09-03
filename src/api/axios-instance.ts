import axiosReal from "axios";
import { wafIntercept } from "../madie-madie-util";

const axios = axiosReal.create();
if (axios && axios.interceptors && axios.interceptors.response) {
  axios.interceptors.response.use((response) => {
    return response;
  }, wafIntercept);
}

export default axios;
