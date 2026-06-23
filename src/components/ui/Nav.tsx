"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, BarChart2, Clock, Home } from "lucide-react";

const links = [
  { href: "/", label: "Αρχική", icon: Home },
  { href: "/inventory", label: "Αποθεματικό", icon: Package },
  { href: "/shopping", label: "Λίστα αγορών", icon: ShoppingCart },
  { href: "/budget", label: "Έξοδα", icon: BarChart2 },
  { href: "/history", label: "Ιστορικό", icon: Clock },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-5xl flex items-center gap-1 h-14">
          <span className="font-bold text-indigo-600 text-lg mr-4">🏠 Σπιτικά</span>
          {links.slice(1).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10">
        <div className="flex">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                pathname === href ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
