import { api } from "@/utils/http";
import { delay, isBypassAuthEnabled, mockUser } from "@/dev/bypass";

export type Me = {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
};

export async function register(
  email: string,
  password: string,
  fullName?: string,
  metadata?: any
) {
  if (isBypassAuthEnabled) {
    await delay();
    return { ...mockUser, email, user_metadata: { full_name: fullName, ...metadata } };
  }

  const { data } = await api.post("/api/auth/register", {
    email,
    password,
    fullName,
    metadata,
  });
  return data;
}

export async function login(email: string, password: string): Promise<Me> {
  if (isBypassAuthEnabled) {
    await delay();
    return { ...mockUser, email: email || mockUser.email };
  }

  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export async function me(): Promise<Me> {
  if (isBypassAuthEnabled) {
    await delay();
    return mockUser;
  }

  const { data } = await api.get("/api/auth/me");
  return data;
}

export async function logout() {
  if (!isBypassAuthEnabled) {
    await api.post("/api/auth/logout");
  } else {
    await delay();
  }

  try {
    sessionStorage.clear();
    localStorage.removeItem("me");
  } catch {}
}

export async function forgotPassword(email: string) {
  if (isBypassAuthEnabled) {
    await delay();
    return;
  }

  await api.post("/api/auth/forgot-password", { email });
}

export async function resetPasswordWithRecoveryToken(
  recoveryAccessToken: string,
  newPassword: string
) {
  if (isBypassAuthEnabled) {
    await delay();
    return;
  }

  await api.post(
    "/api/auth/reset-password",
    { new_password: newPassword },
    { headers: { Authorization: `Bearer ${recoveryAccessToken}` } }
  );
}

export async function exchangeSession(
  accessToken: string,
  refreshToken?: string
): Promise<Me> {
  if (isBypassAuthEnabled) {
    await delay();
    return mockUser;
  }

  const { data } = await api.post("/api/auth/session/exchange", {
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return data;
}
