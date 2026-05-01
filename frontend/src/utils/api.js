const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * API client for the Expense Tracker backend.
 * 
 * Centralizes all HTTP calls, error handling, and header management.
 * The Idempotency-Key header is passed by the caller (generated in the form component)
 * to prevent duplicate expense creation on network retries.
 */

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || "An unexpected error occurred",
      response.status,
      data.details || null
    );
  }

  return data;
}

/**
 * Fetch expenses with optional filtering and sorting.
 */
export async function fetchExpenses({ category, sort } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);

  const queryString = params.toString();
  const url = `${API_BASE}/expenses${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);
  return handleResponse(response);
}

/**
 * Create a new expense.
 * 
 * @param {Object} expense - Expense data
 * @param {string} idempotencyKey - Unique key to prevent duplicate creation
 */
export async function createExpense(expense, idempotencyKey) {
  const response = await fetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(expense),
  });

  return handleResponse(response);
}

/**
 * Fetch distinct categories.
 */
export async function fetchCategories() {
  const response = await fetch(`${API_BASE}/expenses/categories`);
  return handleResponse(response);
}

/**
 * Fetch per-category summary.
 */
export async function fetchSummary() {
  const response = await fetch(`${API_BASE}/expenses/summary`);
  return handleResponse(response);
}

export { ApiError };
