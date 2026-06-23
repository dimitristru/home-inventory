import Link from "next/link";
import { Package, ShoppingCart, BarChart2, Clock, ArrowRight } from "lucide-react";

const stats = [
  { label: "Προϊόντα σε στοκ", value: "—", sub: "αποθεματικό" },
  { label: "Χαμηλό απόθεμα", value: "—", sub: "χρειάζονται αγορά" },
  { label: "Έξοδα μήνα", value: "—€", sub: "Ιούνιος 2026" },
];

const quickLinks = [
  { href: "/inventory", icon: Package, title: "Αποθεματικό", desc: "Δες τι έχεις σπίτι & στην αποθήκη", color: "bg-indigo-50 text-indigo-600" },
  { href: "/shopping", icon: ShoppingCart, title: "Λίστα αγορών", desc: "Τι χρειάζεσαι να αγοράσεις", color: "bg-emerald-50 text-emerald-600" },
  { href: "/budget", icon: BarChart2, title: "Έξοδα & Budget", desc: "Παρακολούθηση δαπανών ανά κατηγορία", color: "bg-amber-50 text-amber-600" },
  { href: "/history", icon: Clock, title: "Ιστορικό αγορών", desc: "Αποδείξεις και παλιές αγορές", color: "bg-rose-50 text-rose-600" },
];

export default function HomePage() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Καλωσήρθες 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Διαχείριση αποθεμάτων & αγορών για το σπίτι</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickLinks.map(({ href, icon: Icon, title, desc, color }) => (
          <Link key={href} href={href} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-start gap-3 hover:shadow-md transition-shadow group">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800">{title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
