import { ERROR_CODES } from "../errors/error-codes.js";
import { organizationParamsSchema } from "../validation/organization.schema.js";
import { validateRequest } from "./validate-request.js";

export const validateOrganizationParams = validateRequest(organizationParamsSchema, {
  code: ERROR_CODES.INVALID_ORG_ID,
  message: "The organization ID is invalid.",
});
