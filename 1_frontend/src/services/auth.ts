// frontend/src/services/auth.ts
import { api } from "@/utils/http";

export type Me = { id: string; email: string; user_metadata?: Record<string, any> };

export async function register(email: string, password: string, fullName?: string, metadata?: any) {
  const { data } = await api.post("/api/auth/register", { email, password, fullName, metadata });
  return data;
}

export async function login(email: string, password: string): Promise<Me> {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export async function me(): Promise<Me> {
  const { data } = await api.get("/api/auth/me");
  return data;
}

export async function logout() {
  await api.post("/api/auth/logout");
}

export async function forgotPassword(email: string) {
  await api.post("/api/auth/forgot-password", { email });
}

export async function resetPasswordWithRecoveryToken(recoveryAccessToken: string, newPassword: string) {
  await api.post(
    "/api/auth/reset-password",
    { new_password: newPassword },
    { headers: { Authorization: `Bearer ${recoveryAccessToken}` } }
  );
}

export async function exchangeSession(accessToken: string, refreshToken?: string): Promise<Me> {
  const { data } = await api.post("/api/auth/session/exchange", {
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return data;
}
