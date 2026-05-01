/**
 * FilterControls — Controls for filtering by category and sorting by date.
 * 
 * Renders a dropdown for category selection (populated from the API)
 * and a toggle for sort order.
 */
export default function FilterControls({
  categories,
  selectedCategory,
  onCategoryChange,
  sortOrder,
  onSortChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3" id="filter-controls">
      {/* Category Filter */}
      <div className="flex-1">
        <label htmlFor="filter-category" className="sr-only">Filter by category</label>
        <div className="relative">
          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-lighter/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200
              appearance-none cursor-pointer"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {/* Sort Toggle */}
      <button
        id="sort-toggle"
        onClick={() => onSortChange(sortOrder === "date_desc" ? "date_asc" : "date_desc")}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-lighter/50 border border-slate-600/50 
          rounded-lg text-sm text-slate-200 hover:bg-surface-lighter/70 hover:border-slate-500/50
          focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all duration-200"
        title={sortOrder === "date_desc" ? "Showing newest first" : "Showing oldest first"}
      >
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${sortOrder === "date_asc" ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
        </svg>
        {sortOrder === "date_desc" ? "Newest first" : "Oldest first"}
      </button>
    </div>
  );
}
