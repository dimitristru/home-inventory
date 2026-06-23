import { BarChart2, TrendingUp } from "lucide-react";

const months = ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαΐ", "Ιούν"];

export default function BudgetPage() {
  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Έξοδα & Budget</h1>
        <p className="text-sm text-slate-500">Ιούνιος 2026</p>
      </div>

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {months.map((m, i) => (
          <button key={m} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${i === 5 ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Total card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">Σύνολο μήνα</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">—€</p>
          </div>
          <div className="bg-indigo-50 p-2 rounded-lg">
            <TrendingUp size={20} className="text-indigo-500" />
          </div>
        </div>
        <div className="mt-4 h-2 bg-slate-100 rounded-full">
          <div className="h-full w-0 bg-indigo-500 rounded-full" />
        </div>
        <p className="text-xs text-slate-400 mt-1">Budget δεν έχει οριστεί ακόμα</p>
      </div>

      {/* Categories breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Ανά κατηγορία</h2>
        </div>
        <div className="p-12 flex flex-col items-center text-center gap-3">
          <div className="bg-amber-50 p-4 rounded-full">
            <BarChart2 size={32} className="text-amber-400" />
          </div>
          <p className="text-sm text-slate-500">Δεν υπάρχουν αγορές αυτόν τον μήνα</p>
        </div>
      </div>
    </div>
  );
}
