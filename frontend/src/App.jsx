import { useExpenses } from "./hooks/useExpenses";
import { formatMoney } from "./utils/money";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import FilterControls from "./components/FilterControls";
import SummaryView from "./components/SummaryView";

/**
 * App — Root component for the Expense Tracker.
 * 
 * Layout:
 * - Left/Top: Expense form + category summary (sidebar on desktop)
 * - Right/Bottom: Filter controls + expense list with total
 */
function App() {
  const {
    expenses,
    categories,
    summary,
    total,
    count,
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    setSortOrder,
    isLoading,
    isSubmitting,
    error,
    submitError,
    setSubmitError,
    addExpense,
  } = useExpenses();

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-100">Expense Tracker</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Track and manage your personal expenses</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Sidebar — Form + Summary */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Add Expense Card */}
            <section className="bg-surface-card border border-slate-700/40 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Expense
              </h2>
              <ExpenseForm
                onSubmit={addExpense}
                isSubmitting={isSubmitting}
                submitError={submitError}
                onClearError={() => setSubmitError(null)}
              />
            </section>

            {/* Category Summary Card */}
            {summary.length > 0 && (
              <section className="bg-surface-card border border-slate-700/40 rounded-2xl p-6">
                <SummaryView summary={summary} />
              </section>
            )}
          </div>

          {/* Right Content — Filters + List */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Total + Filters Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Total Display */}
              <div className="flex items-baseline gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    {selectedCategory ? `Total (${selectedCategory})` : "Total Expenses"}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums" id="total-display">
                    {formatMoney(Number(total))}
                  </p>
                </div>
                <span className="text-xs text-slate-500 bg-surface-lighter/50 px-2 py-1 rounded-md">
                  {count} {count === 1 ? "entry" : "entries"}
                </span>
              </div>

              {/* Filter & Sort Controls */}
              <FilterControls
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
              />
            </div>

            {/* Expense List */}
            <section className="bg-surface-card border border-slate-700/40 rounded-2xl p-4 sm:p-6">
              <ExpenseList
                expenses={expenses}
                isLoading={isLoading}
                error={error}
              />
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-slate-600 text-center">
            Built with Express, SQLite, React & Tailwind CSS — Amounts stored as integers (paise) for precision
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
