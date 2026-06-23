import { Clock, Plus, Receipt } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Ιστορικό αγορών</h1>
          <p className="text-sm text-slate-500">Αποδείξεις & παλιές αγορές</p>
        </div>
        <button className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors">
          <Plus size={16} />
          Νέα αγορά
        </button>
      </div>

      {/* Scan receipt CTA */}
      <button className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity">
        <div className="bg-white/20 p-2 rounded-lg">
          <Receipt size={20} />
        </div>
        <div className="text-left">
          <p className="font-semibold">Σκάναρε απόδειξη</p>
          <p className="text-sm text-white/80">Φωτογράφισε και καταγράψτε αυτόματα</p>
        </div>
      </button>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 flex flex-col items-center text-center gap-3">
        <div className="bg-rose-50 p-4 rounded-full">
          <Clock size={32} className="text-rose-400" />
        </div>
        <div>
          <p className="font-semibold text-slate-700">Δεν υπάρχει ιστορικό ακόμα</p>
          <p className="text-sm text-slate-500 mt-1">Πρόσθεσε την πρώτη σου αγορά ή σκάναρε απόδειξη</p>
        </div>
      </div>
    </div>
  );
}
