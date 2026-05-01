import { useState, useCallback, useRef, useEffect } from "react";
import { fetchExpenses, fetchCategories, fetchSummary, createExpense } from "../utils/api";

/**
 * Custom hook that manages all expense-related state and API calls.
 * 
 * Centralizes loading/error states, filtering, and data fetching
 * so components stay focused on presentation.
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState([]);
  const [totalCents, setTotalCents] = useState(0);
  const [total, setTotal] = useState("0.00");
  const [count, setCount] = useState(0);

  // Filter & sort state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("date_desc");

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Track if we've done initial load
  const initialLoadDone = useRef(false);

  /**
   * Fetch expenses from the API with current filter/sort settings.
   */
  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (sortOrder) params.sort = sortOrder;

      const result = await fetchExpenses(params);

      setExpenses(result.data);
      setTotalCents(result.total_cents);
      setTotal(result.total);
      setCount(result.count);
    } catch (err) {
      setError(err.message || "Failed to load expenses");
      console.error("Failed to load expenses:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, sortOrder]);

  /**
   * Load categories for the filter dropdown.
   */
  const loadCategories = useCallback(async () => {
    try {
      const result = await fetchCategories();
      setCategories(result.data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  /**
   * Load per-category summary.
   */
  const loadSummary = useCallback(async () => {
    try {
      const result = await fetchSummary();
      setSummary(result.data);
    } catch (err) {
      console.error("Failed to load summary:", err);
    }
  }, []);

  /**
   * Submit a new expense.
   * Returns true on success, false on failure.
   */
  const addExpense = useCallback(async (expenseData, idempotencyKey) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await createExpense(expenseData, idempotencyKey);

      // Refresh all data after successful creation
      await Promise.all([loadExpenses(), loadCategories(), loadSummary()]);

      return true;
    } catch (err) {
      const message = err.details
        ? err.details.map((d) => `${d.field}: ${d.message}`).join(", ")
        : err.message || "Failed to create expense";
      setSubmitError(message);
      console.error("Failed to create expense:", err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadExpenses, loadCategories, loadSummary]);

  // Initial load + reload when filters change
  useEffect(() => {
    loadExpenses();
    if (!initialLoadDone.current) {
      loadCategories();
      loadSummary();
      initialLoadDone.current = true;
    }
  }, [loadExpenses, loadCategories, loadSummary]);

  return {
    // Data
    expenses,
    categories,
    summary,
    totalCents,
    total,
    count,

    // Filters
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    setSortOrder,

    // State
    isLoading,
    isSubmitting,
    error,
    submitError,
    setSubmitError,

    // Actions
    addExpense,
    refresh: loadExpenses,
  };
}
