import { api } from ".";
import type { ApiResponse } from "@/types/api.types";
import type { User, LoginInput, RegisterInput } from "@/types/auth.types";
import { ApiError } from "@/utils/api-error";

export async function getProfile() {
  const user = (
    await api.get<ApiResponse<User>>("/auth/me", {
      headers: { "Cache-Control": "no-cache" },
    })
  ).data.data;
  if (
    !user ||
    typeof user._id !== "string" ||
    typeof user.full_name !== "string" ||
    typeof user.email !== "string" ||
    typeof user.role !== "string"
  )
    throw new ApiError(
      "The server returned an invalid account profile. Please try signing in again.",
    );
  return user;
}
export async function login(input: LoginInput) {
  await api.post<ApiResponse<{ user: User; access_token: string }>>(
    "/auth/login",
    input,
  );
  // Verify the browser accepted the cookie instead of relying on the returned token.
  return getProfile();
}
export async function register(input: RegisterInput) {
  await api.post("/auth/register", input);
}
export async function logout() {
  await api.post("/auth/logout");
}
