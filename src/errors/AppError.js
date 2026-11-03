/**
 * An application error with a stable public code and an HTTP status.
 * For 4xx errors, message is public. Keep private diagnostic details in cause.
 */
export class AppError extends Error {
  constructor(code, { statusCode = 500, message = "Não foi possível concluir a solicitação.", cause } = {}) {
    if (!Number.isSafeInteger(code) || code <= 0) {
      throw new TypeError("AppError code must be a positive safe integer.");
    }
    if (typeof message !== "string" || message.trim().length === 0) {
      throw new TypeError("AppError message must be a non-empty string.");
    }

    if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
      throw new TypeError(
        "AppError statusCode must be an integer from 400 to 599.",
      );
    }

    super(message, { cause });
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
