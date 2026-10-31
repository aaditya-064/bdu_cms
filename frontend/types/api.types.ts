export type ApiResponse<T> = {
  message: string;
  data: T;
  success: boolean;
  status: "success" | "fail" | "error";
};
