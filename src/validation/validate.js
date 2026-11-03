import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/error-codes.js";

// Works with req.params, req.query, or req.body without mutating the request.
export function validate(schema, input, {
  code = ERROR_CODES.INVALID_REQUEST,
  message = "Invalid request parameters.",
} = {}) {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new AppError(code, {
      statusCode: 400,
      message,
      cause: result.error,
    });
  }

  return result.data;
}
