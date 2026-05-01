import { useState, useCallback, useRef } from "react";
import { validateAmount } from "../utils/money";

/**
 * Default categories for the dropdown.
 * Users can also type a custom category.
 */
const DEFAULT_CATEGORIES = [
  "food",
  "transport",
  "entertainment",
  "utilities",
  "shopping",
  "health",
  "education",
  "rent",
  "travel",
  "other",
];

/**
 * ExpenseForm — Form for creating a new expense entry.
 * 
 * Key resilience features:
 * - Generates a unique idempotency key per form submission
 * - Disables submit button immediately on click to prevent double-submission
 * - Shows validation errors inline before hitting the API
 * - Clears form and generates new idempotency key on successful submission
 */
export default function ExpenseForm({ onSubmit, isSubmitting, submitError, onClearError }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState({});

  // Generate a fresh idempotency key for each new submission attempt
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const validate = useCallback(() => {
    const newErrors = {};

    // Amount validation
    const amountError = validateAmount(amount);
    if (!amount) {
      newErrors.amount = "Amount is required";
    } else if (amountError) {
      newErrors.amount = amountError;
    }

    // Category validation
    const effectiveCategory = category === "__custom__" ? customCategory.trim() : category;
    if (!effectiveCategory) {
      newErrors.category = "Category is required";
    }

    // Date validation
    if (!date) {
      newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, category, customCategory, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onClearError) onClearError();

    if (!validate()) return;

    const effectiveCategory = category === "__custom__" ? customCategory.trim() : category;

    const success = await onSubmit(
      {
        amount: Number(amount),
        category: effectiveCategory,
        description: description.trim(),
        date,
      },
      idempotencyKeyRef.current
    );

    if (success) {
      // Reset form and generate new idempotency key
      setAmount("");
      setCategory("");
      setCustomCategory("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setErrors({});
      idempotencyKeyRef.current = crypto.randomUUID();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" id="expense-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Amount Field */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1.5">
            Amount (₹) <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
              }}
              placeholder="0.00"
              disabled={isSubmitting}
              className={`w-full pl-8 pr-4 py-2.5 bg-surface-lighter/50 border rounded-lg text-slate-100 placeholder-slate-500 
                focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.amount ? "border-danger/50" : "border-slate-600/50"}`}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-xs text-danger" role="alert">{errors.amount}</p>
          )}
        </div>

        {/* Date Field */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1.5">
            Date <span className="text-danger">*</span>
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
            }}
            disabled={isSubmitting}
            className={`w-full px-4 py-2.5 bg-surface-lighter/50 border rounded-lg text-slate-100 
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${errors.date ? "border-danger/50" : "border-slate-600/50"}`}
          />
          {errors.date && (
            <p className="mt-1 text-xs text-danger" role="alert">{errors.date}</p>
          )}
        </div>

        {/* Category Field */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1.5">
            Category <span className="text-danger">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (e.target.value !== "__custom__") setCustomCategory("");
              if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
            }}
            disabled={isSubmitting}
            className={`w-full px-4 py-2.5 bg-surface-lighter/50 border rounded-lg text-slate-100 
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${errors.category ? "border-danger/50" : "border-slate-600/50"}`}
          >
            <option value="">Select a category</option>
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
            <option value="__custom__">+ Custom category</option>
          </select>
          {category === "__custom__" && (
            <input
              id="custom-category"
              type="text"
              value={customCategory}
              onChange={(e) => {
                setCustomCategory(e.target.value);
                if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
              }}
              placeholder="Enter custom category"
              disabled={isSubmitting}
              className="mt-2 w-full px-4 py-2.5 bg-surface-lighter/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          )}
          {errors.category && (
            <p className="mt-1 text-xs text-danger" role="alert">{errors.category}</p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1.5">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Lunch with team"
            disabled={isSubmitting}
            maxLength={500}
            className="w-full px-4 py-2.5 bg-surface-lighter/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger" role="alert">
          <span className="font-medium">Error:</span> {submitError}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        id="submit-expense"
        className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800
          text-white font-medium rounded-lg transition-all duration-200 
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600
          focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-surface
          flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Adding...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Expense
          </>
        )}
      </button>
    </form>
  );
}
