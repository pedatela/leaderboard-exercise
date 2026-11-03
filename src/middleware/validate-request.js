import { validate } from "../validation/validate.js";

export function validateRequest(schema, { source = "params", ...options } = {}) {
  if (!["params", "query", "body"].includes(source)) {
    throw new TypeError("Validation source must be params, query, or body.");
  }

  return (req, res, next) => {
    try {
      const data = validate(schema, req[source], options);
      res.locals.validated ??= {};
      res.locals.validated[source] = data;
      next();
    } catch (err) {
      next(err);
    }
  };
}
