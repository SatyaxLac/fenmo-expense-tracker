import { z } from "zod";

/**
 * Zod schema for expense creation.
 * 
 * Validation rules:
 * - amount: Must be a positive number. Frontend sends human-readable amounts
 *   (e.g., 42.50), which the route handler converts to cents (4250).
 * - category: Non-empty string, trimmed. We normalize to lowercase for consistent filtering.
 * - description: Optional string, defaults to empty.
 * - date: Must be a valid ISO date string (YYYY-MM-DD format).
 */
export const createExpenseSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required", invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .finite("Amount must be a finite number")
    .refine((val) => {
      // Ensure no more than 2 decimal places (money precision)
      const parts = val.toString().split(".");
      return !parts[1] || parts[1].length <= 2;
    }, "Amount cannot have more than 2 decimal places"),

  category: z
    .string({ required_error: "Category is required" })
    .trim()
    .min(1, "Category cannot be empty")
    .max(100, "Category is too long")
    .transform((val) => val.toLowerCase()),

  description: z
    .string()
    .trim()
    .max(500, "Description is too long")
    .default(""),

  date: z
    .string({ required_error: "Date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime());
    }, "Date must be a valid calendar date"),
});

/**
 * Query parameter validation for GET /expenses
 */
export const getExpensesQuerySchema = z.object({
  category: z
    .string()
    .trim()
    .transform((val) => val.toLowerCase())
    .optional(),

  sort: z
    .enum(["date_desc", "date_asc"])
    .optional()
    .default("date_desc"),
});

/**
 * Express middleware factory for validating request bodies with Zod.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Express middleware factory for validating query parameters with Zod.
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({
        error: "Invalid query parameters",
        details: errors,
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}
