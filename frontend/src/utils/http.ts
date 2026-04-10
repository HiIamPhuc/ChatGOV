import axios from "axios";
import { isBypassAuthEnabled } from "@/dev/bypass";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (!isBypassAuthEnabled && err?.response?.status === 401) {
      window.location.href = "/signin";
    }
    return Promise.reject(err);
  }
);
