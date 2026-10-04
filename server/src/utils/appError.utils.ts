class AppError extends Error {
  status: "error" | "fail";
  isOperation: boolean;
  constructor(
    public message: string,
    public statusCode: number,
    public errors?: any[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.isOperation = true;
    this.errors = errors;
    Error.captureStackTrace(this, AppError);
  }
}

export default AppError;
