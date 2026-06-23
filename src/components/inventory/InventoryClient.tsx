"use client";
import { useState, useTransition } from "react";
import { Plus, Search, Minus, Trash2, Package, Pencil, ScanLine } from "lucide-react";
import { updateQuantity, deleteProduct } from "@/app/actions/inventory";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import dynamic from "next/dynamic";
const BarcodeScanner = dynamic(() => import("@/components/scanner/BarcodeScanner"), { ssr: false });
import type { Category, Location } from "@/types/database";

interface InventoryRow {
  id: string;
  quantity: number;
  location_id: string;
  products: {
    id: string;
    name: string;
    brand: string | null;
    unit: string;
    min_quantity: number;
    categories: { name: string; icon: string | null; color: string } | null;
  };
  locations: { name: string; icon: string } | null;
}

interface Props {
  inventory: InventoryRow[];
  categories: Category[];
  locations: Location[];
}

export default function InventoryClient({ inventory, categories, locations }: Props) {
  const [search, setSearch] = useState("");
  const [activeLocation, setActiveLocation] = useState<string>("total");
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editItem, setEditItem] = useState<InventoryRow | null>(null);
  const [, startTransition] = useTransition();

  // Σύνολο: group by product name, sum quantities across all locations
  const totals = Object.values(
    inventory.reduce((acc, item) => {
      const key = item.products.name.toLowerCase().trim();
      if (!acc[key]) {
        acc[key] = { ...item, quantity: 0, locations_summary: [] as string[] };
      }
      acc[key].quantity += item.quantity;
      acc[key].locations_summary.push(`${item.locations?.icon ?? ""} ${item.locations?.name ?? ""}: ${item.quantity} ${item.products.unit}`);
      return acc;
    }, {} as Record<string, InventoryRow & { locations_summary: string[] }>)
  );

  const filtered = activeLocation === "total"
    ? totals.filter(item =>
        item.products.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.products.brand ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : inventory.filter(item => {
        const matchSearch = item.products.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.products.brand ?? "").toLowerCase().includes(search.toLowerCase());
        const matchLoc = activeLocation === "all" || item.location_id === activeLocation;
        return matchSearch && matchLoc;
      });

  const lowStock = inventory.filter(i => i.quantity <= i.products.min_quantity).length;

  function handleQty(id: string, delta: number) {
    startTransition(() => updateQuantity(id, delta));
  }

  function handleDelete(productId: string) {
    if (!confirm("Διαγραφή προϊόντος;")) return;
    startTransition(() => deleteProduct(productId));
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Αποθεματικό</h1>
          <p className="text-sm text-slate-500">
            {inventory.length} προϊόντα
            {lowStock > 0 && <span className="text-orange-500 ml-2">· {lowStock} χαμηλό απόθεμα</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
            <ScanLine size={16} />
            Scan
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} />
            Προσθήκη
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          className="flex-1 outline-none text-sm text-slate-700 placeholder:text-slate-400"
          placeholder="Αναζήτηση προϊόντος..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Location tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveLocation("total")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeLocation === "total" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
        >
          📊 Σύνολο
        </button>
        <button
          onClick={() => setActiveLocation("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeLocation === "all" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
        >
          Όλα
        </button>
        {locations.map(loc => (
          <button
            key={loc.id}
            onClick={() => setActiveLocation(loc.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeLocation === loc.id ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
          >
            {loc.icon} {loc.name}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <div className="bg-indigo-50 p-4 rounded-full">
            <Package size={32} className="text-indigo-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">
              {search ? "Δεν βρέθηκαν προϊόντα" : "Δεν υπάρχουν προϊόντα ακόμα"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {search ? "Δοκίμασε διαφορετική αναζήτηση" : "Πρόσθεσε το πρώτο σου προϊόν"}
            </p>
          </div>
          {!search && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <Plus size={16} />
              Πρόσθεσε προϊόν
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const isLow = item.quantity <= item.products.min_quantity;
            const isTotal = activeLocation === "total";
            const locSummary = (item as typeof item & { locations_summary?: string[] }).locations_summary;
            return (
              <div key={item.products.id} className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 ${isLow ? "border-orange-200" : "border-slate-100"}`}>
                {/* Category icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: item.products.categories?.color ? `${item.products.categories.color}20` : "#f1f5f9" }}
                >
                  {item.products.categories?.icon ?? "📦"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{item.products.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {item.products.brand && <span>{item.products.brand} · </span>}
                    {isTotal && locSummary
                      ? locSummary.join("  ·  ")
                      : <>{item.locations?.icon} {item.locations?.name}</>
                    }
                    {isLow && <span className="text-orange-500 ml-1">· χαμηλό!</span>}
                  </p>
                </div>

                {/* Quantity — total mode: just badge, normal: +/- controls */}
                {isTotal ? (
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-bold text-slate-800">{item.quantity}</span>
                    <span className="text-xs text-slate-400 ml-1">{item.products.unit}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleQty(item.id, -1)} className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-semibold text-slate-800 w-10 text-center">
                      {item.quantity} <span className="text-xs font-normal text-slate-400">{item.products.unit}</span>
                    </span>
                    <button onClick={() => handleQty(item.id, 1)} className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                      <Plus size={14} />
                    </button>
                  </div>
                )}

                {/* Edit & Delete */}
                {!isTotal && (
                  <button onClick={() => setEditItem(item)} className="text-slate-300 hover:text-indigo-400 transition-colors">
                    <Pencil size={15} />
                  </button>
                )}
                <button onClick={() => handleDelete(item.products.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddProductModal categories={categories} locations={locations} onClose={() => setShowAdd(false)} />
      )}

      {showScanner && (
        <BarcodeScanner onClose={() => setShowScanner(false)} />
      )}

      {editItem && (
        <EditProductModal
          inventoryId={editItem.id}
          product={editItem.products}
          currentLocationId={editItem.location_id}
          currentQuantity={editItem.quantity}
          categories={categories}
          locations={locations}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}
