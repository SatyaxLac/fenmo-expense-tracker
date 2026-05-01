/**
 * Money utility functions.
 * 
 * We store money as integers (cents/paise) in the database to avoid
 * floating-point precision issues that plague financial calculations.
 * 
 * Examples:
 *   ₹42.50 → 4250 cents
 *   ₹100.00 → 10000 cents
 */

/**
 * Format cents to a human-readable currency string.
 * @param {number} cents - Amount in smallest currency unit
 * @returns {string} Formatted string like "₹1,234.56"
 */
export function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate total from an array of expense objects.
 * Uses integer arithmetic on cents to avoid floating-point errors,
 * then converts to display amount.
 * 
 * @param {Array<{amount_cents: number}>} expenses
 * @returns {number} Total in human-readable units
 */
export function calculateTotal(expenses) {
  const totalCents = expenses.reduce(
    (sum, expense) => sum + expense.amount_cents,
    0
  );
  return totalCents / 100;
}

/**
 * Validate an amount string/number for money input.
 * Returns null if valid, or an error message string.
 */
export function validateAmount(value) {
  const num = Number(value);
  if (isNaN(num)) return "Amount must be a number";
  if (num <= 0) return "Amount must be greater than zero";
  if (!isFinite(num)) return "Amount must be a finite number";
  
  const parts = value.toString().split(".");
  if (parts[1] && parts[1].length > 2) {
    return "Amount cannot have more than 2 decimal places";
  }
  
  return null;
}
