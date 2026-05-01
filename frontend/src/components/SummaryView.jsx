import { formatMoney } from "../utils/money";

/**
 * SummaryView — Displays per-category expense breakdown.
 * 
 * Shows a visual breakdown with proportional bars for each category.
 * This is a "nice-to-have" feature that adds real value for understanding spending.
 */
export default function SummaryView({ summary }) {
  if (!summary || summary.length === 0) return null;

  const maxTotal = Math.max(...summary.map((s) => s.total_cents));

  // Category colors for the bars
  const categoryColors = {
    food: "bg-orange-500",
    transport: "bg-blue-500",
    entertainment: "bg-purple-500",
    utilities: "bg-yellow-500",
    shopping: "bg-pink-500",
    health: "bg-green-500",
    education: "bg-cyan-500",
    rent: "bg-red-500",
    travel: "bg-indigo-500",
  };

  const getBarColor = (cat) => categoryColors[cat] || "bg-slate-500";

  return (
    <div className="space-y-3" id="summary-view">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
        Spending by Category
      </h3>
      <div className="space-y-2.5">
        {summary.map((item) => {
          const percentage = maxTotal > 0 ? (item.total_cents / maxTotal) * 100 : 0;

          return (
            <div key={item.category} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300 capitalize">{item.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{item.count} expense{item.count !== 1 ? "s" : ""}</span>
                  <span className="text-sm font-medium text-slate-200 tabular-nums">
                    {formatMoney(Number(item.total))}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-surface-lighter rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor(item.category)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
