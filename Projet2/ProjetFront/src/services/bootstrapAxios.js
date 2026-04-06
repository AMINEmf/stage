import axios from "axios";
import { API_BASE_URL, normalizeApiUrl } from "./apiConfig";

let isBootstrapped = false;

export const bootstrapAxios = () => {
  if (isBootstrapped) {
    return;
  }

  isBootstrapped = true;

  axios.defaults.baseURL = API_BASE_URL;
  axios.defaults.headers.common.Accept = "application/json";

  axios.interceptors.request.use((config) => {
    if (typeof config.url === "string") {
      config.url = normalizeApiUrl(config.url);
    }

    const token = localStorage.getItem("API_TOKEN");
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  });
};
