import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../db.js";
import {
  createExpenseSchema,
  getExpensesQuerySchema,
  validateBody,
  validateQuery,
} from "../middleware/validation.js";

const router = Router();

/**
 * POST /expenses
 * 
 * Creates a new expense entry.
 * 
 * Idempotency:
 *   The client SHOULD send an `Idempotency-Key` header (a UUID).
 *   - If the key has been seen before, we return the existing record with 200
 *     (not 201), preventing duplicate entries on retries.
 *   - If no key is provided, we generate one server-side. This means that
 *     without client cooperation, duplicates are still possible from retries,
 *     but the frontend is designed to always send the key.
 * 
 * Money handling:
 *   The client sends `amount` as a human-readable float (e.g., 42.50).
 *   We convert to integer cents (4250) before storage to avoid floating-point
 *   precision issues. The conversion uses Math.round to handle any remaining
 *   floating-point artifacts (e.g., 42.50 * 100 = 4249.999... in some cases).
 */
router.post(
  "/",
  validateBody(createExpenseSchema),
  (req, res) => {
    try {
      const db = getDatabase();
      const { amount, category, description, date } = req.validatedBody;
      const idempotencyKey = req.headers["idempotency-key"] || null;

      // Check for existing entry with this idempotency key
      if (idempotencyKey) {
        const existing = db
          .prepare("SELECT * FROM expenses WHERE idempotency_key = ?")
          .get(idempotencyKey);

        if (existing) {
          // Return the existing record — this is a retry, not a new expense
          return res.status(200).json({
            data: formatExpense(existing),
            _idempotent: true,
          });
        }
      }

      const id = uuidv4();
      // Convert human-readable amount to cents (smallest currency unit)
      const amountCents = Math.round(amount * 100);

      const stmt = db.prepare(`
        INSERT INTO expenses (id, idempotency_key, amount_cents, category, description, date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, idempotencyKey, amountCents, category, description, date);

      const created = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);

      return res.status(201).json({
        data: formatExpense(created),
      });
    } catch (error) {
      // Handle unique constraint violation on idempotency_key (race condition)
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        const db = getDatabase();
        const idempotencyKey = req.headers["idempotency-key"];
        const existing = db
          .prepare("SELECT * FROM expenses WHERE idempotency_key = ?")
          .get(idempotencyKey);
        if (existing) {
          return res.status(200).json({
            data: formatExpense(existing),
            _idempotent: true,
          });
        }
      }

      console.error("Error creating expense:", error);
      return res.status(500).json({ error: "Failed to create expense" });
    }
  }
);

/**
 * GET /expenses
 * 
 * Returns a list of expenses with optional filtering and sorting.
 * 
 * Query parameters:
 *   - category: Filter by category (case-insensitive, stored lowercase)
 *   - sort: "date_desc" (default) or "date_asc"
 * 
 * Response includes:
 *   - data: Array of expense objects
 *   - total_cents: Sum of amount_cents for the filtered result set
 *   - total: Human-readable total (e.g., "4250.00" for ₹4250)
 *   - count: Number of expenses in the result set
 */
router.get(
  "/",
  validateQuery(getExpensesQuerySchema),
  (req, res) => {
    try {
      const db = getDatabase();
      const { category, sort } = req.validatedQuery;

      let query = "SELECT * FROM expenses";
      let countQuery = "SELECT COUNT(*) as count, COALESCE(SUM(amount_cents), 0) as total_cents FROM expenses";
      const params = [];
      const conditions = [];

      if (category) {
        conditions.push("category = ?");
        params.push(category);
      }

      if (conditions.length > 0) {
        const whereClause = " WHERE " + conditions.join(" AND ");
        query += whereClause;
        countQuery += whereClause;
      }

      // Sorting
      const orderDirection = sort === "date_asc" ? "ASC" : "DESC";
      query += ` ORDER BY date ${orderDirection}, created_at ${orderDirection}`;

      const expenses = db.prepare(query).all(...params);
      const aggregates = db.prepare(countQuery).get(...params);

      return res.status(200).json({
        data: expenses.map(formatExpense),
        total_cents: aggregates.total_cents,
        total: (aggregates.total_cents / 100).toFixed(2),
        count: aggregates.count,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return res.status(500).json({ error: "Failed to fetch expenses" });
    }
  }
);

/**
 * GET /expenses/categories
 * 
 * Returns distinct categories for filter dropdowns.
 */
router.get("/categories", (req, res) => {
  try {
    const db = getDatabase();
    const categories = db
      .prepare("SELECT DISTINCT category FROM expenses ORDER BY category ASC")
      .all()
      .map((row) => row.category);

    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/**
 * GET /expenses/summary
 * 
 * Returns a per-category summary with total amounts.
 * Nice-to-have feature for category breakdown view.
 */
router.get("/summary", (req, res) => {
  try {
    const db = getDatabase();
    const summary = db
      .prepare(`
        SELECT 
          category, 
          COUNT(*) as count, 
          SUM(amount_cents) as total_cents
        FROM expenses 
        GROUP BY category 
        ORDER BY total_cents DESC
      `)
      .all()
      .map((row) => ({
        category: row.category,
        count: row.count,
        total_cents: row.total_cents,
        total: (row.total_cents / 100).toFixed(2),
      }));

    return res.status(200).json({ data: summary });
  } catch (error) {
    console.error("Error fetching summary:", error);
    return res.status(500).json({ error: "Failed to fetch summary" });
  }
});

/**
 * Format a raw DB row into an API response object.
 * Converts cents back to a human-readable amount.
 */
function formatExpense(row) {
  return {
    id: row.id,
    amount: row.amount_cents / 100,
    amount_cents: row.amount_cents,
    category: row.category,
    description: row.description,
    date: row.date,
    created_at: row.created_at,
  };
}

export default router;
