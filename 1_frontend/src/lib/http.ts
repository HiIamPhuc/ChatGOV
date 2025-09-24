// frontend/src/lib/http.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true, // nhận cookie HttpOnly
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // tùy bạn: chuyển sang /signin hay giữ nguyên
      // window.location.href = "/signin";
    }
    return Promise.reject(err);
  }
);
