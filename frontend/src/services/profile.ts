import { api } from "@/utils/http";
import {
  delay,
  getMockProfile,
  isBypassAuthEnabled,
  updateMockProfile,
} from "@/dev/bypass";

export type Profile = {
  id: string;
  email: string;
  name?: string | null;
  age?: number | null;
  city?: string | null;
  phone?: string | null;
  dob?: string | null;
};

export type UpdateProfilePayload = Partial<{
  name: string | null;
  age: number | null;
  city: string | null;
  phone: string | null;
  dob: string | null;
}>;

export async function getProfile(): Promise<Profile> {
  if (isBypassAuthEnabled) {
    await delay();
    return getMockProfile();
  }

  const { data } = await api.get("/api/profile");
  return data;
}

export async function updateProfile(
  patch: UpdateProfilePayload
): Promise<Profile> {
  if (isBypassAuthEnabled) {
    await delay();
    return updateMockProfile(patch);
  }

  const { data } = await api.put("/api/profile", patch);
  return data;
}

export async function changePassword(
  current_password: string,
  next_password: string
) {
  if (isBypassAuthEnabled) {
    await delay();
    return;
  }

  await api.put("/api/profile/password", { current_password, next_password });
}
