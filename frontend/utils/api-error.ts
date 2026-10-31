import axios from "axios";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export function isSessionError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  return (
    error.status === 401 ||
    /unauthroized login|unauthorized login|invalid token|token expired|jwt expired|profile not found/i.test(
      error.message,
    )
  );
}
export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "The request could not be completed. Please try again.";
}
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error))
    return new ApiError(
      "The request could not be completed. Please try again.",
    );
  if (!error.response)
    return new ApiError(
      error.code === "ECONNABORTED"
        ? "The server took too long to respond. Please try again."
        : "Unable to reach the server. Check your connection and try again.",
    );
  const data = error.response.data as
    { message?: unknown; details?: unknown } | undefined;
  const message =
    typeof data?.message === "string"
      ? data.message
      : "The request could not be completed. Please try again.";
  // Never show server stacks or database internals to users.
  if (/E11000|duplicate key/i.test(message))
    return new ApiError(
      "A record with those details already exists.",
      error.response.status,
    );
  if (/cast to objectid|cast to number/i.test(message))
    return new ApiError(
      "Some details are invalid. Please check the form and try again.",
      error.response.status,
    );
  if (/forbidden|access denied/i.test(message))
    return new ApiError(
      "You do not have permission to perform this action.",
      403,
    );
  return new ApiError(message, error.response.status);
}
