import { formatMoney } from "../utils/money";

/**
 * ExpenseList — Renders a responsive table/list of expenses.
 * 
 * Handles empty states, loading skeleton, and error display.
 * Shows human-readable amounts formatted with INR currency.
 */
export default function ExpenseList({ expenses, isLoading, error }) {
  if (error) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/30 rounded-xl text-center">
        <svg className="h-10 w-10 text-danger mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-danger font-medium">{error}</p>
        <p className="text-slate-400 text-sm mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading expenses">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-surface-lighter/30 rounded-lg">
            <div className="h-10 w-10 bg-slate-700 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-700/60 rounded w-1/2" />
            </div>
            <div className="h-5 bg-slate-700 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg className="h-16 w-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
        <p className="text-slate-400 text-lg font-medium">No expenses yet</p>
        <p className="text-slate-500 text-sm mt-1">Add your first expense using the form above.</p>
      </div>
    );
  }

  // Category badge color mapping
  const categoryColors = {
    food: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    transport: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    entertainment: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    utilities: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    shopping: "bg-pink-500/15 text-pink-400 border-pink-500/20",
    health: "bg-green-500/15 text-green-400 border-green-500/20",
    education: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    rent: "bg-red-500/15 text-red-400 border-red-500/20",
    travel: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  };

  const getColorClasses = (cat) =>
    categoryColors[cat] || "bg-slate-500/15 text-slate-400 border-slate-500/20";

  // Category icon mapping
  const categoryIcons = {
    food: "🍔",
    transport: "🚗",
    entertainment: "🎬",
    utilities: "💡",
    shopping: "🛍️",
    health: "🏥",
    education: "📚",
    rent: "🏠",
    travel: "✈️",
    other: "📋",
  };

  const getIcon = (cat) => categoryIcons[cat] || "📋";

  return (
    <div className="space-y-2" id="expense-list">
      {expenses.map((expense, index) => (
        <div
          key={expense.id}
          className="group flex items-center gap-4 p-4 bg-surface-lighter/30 hover:bg-surface-lighter/50 
            border border-slate-700/30 hover:border-slate-600/50 rounded-xl transition-all duration-200"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          {/* Category Icon */}
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-surface-lighter rounded-lg text-lg">
            {getIcon(expense.category)}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getColorClasses(expense.category)}`}>
                {expense.category}
              </span>
              <span className="text-slate-500 text-xs">
                {new Date(expense.date + "T00:00:00").toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            {expense.description && (
              <p className="mt-1 text-sm text-slate-400 truncate">{expense.description}</p>
            )}
          </div>

          {/* Amount */}
          <div className="flex-shrink-0 text-right">
            <span className="text-base font-semibold text-slate-100 tabular-nums">
              {formatMoney(expense.amount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
