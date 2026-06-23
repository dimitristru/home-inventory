"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { editProduct } from "@/app/actions/inventory";
import type { Category, Location } from "@/types/database";

const UNITS = ["τεμ", "κιλά", "γρ", "λίτρα", "ml", "πακέτο", "κουτί"];

interface Props {
  inventoryId: string;
  product: {
    id: string; name: string; brand: string | null;
    category_id: string | null; unit: string; min_quantity: number;
  };
  currentLocationId: string;
  currentQuantity: number;
  categories: Category[];
  locations: Location[];
  onClose: () => void;
}

export default function EditProductModal({ inventoryId, product, currentLocationId, currentQuantity, categories, locations, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: product.name,
    brand: product.brand ?? "",
    category_id: product.category_id ?? "",
    unit: product.unit,
    min_quantity: product.min_quantity,
    location_id: currentLocationId,
    quantity: currentQuantity,
  });

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await editProduct(product.id, inventoryId, {
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        category_id: form.category_id || undefined,
        unit: form.unit,
        min_quantity: Number(form.min_quantity),
        location_id: form.location_id,
        quantity: Number(form.quantity),
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Κάτι πήγε στραβά");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-bold text-slate-800 text-lg">Επεξεργασία προϊόντος</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Όνομα *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400" autoFocus />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Μάρκα</label>
            <input value={form.brand} onChange={e => set("brand", e.target.value)}
              placeholder="π.χ. Νουνού"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Κατηγορία</label>
              <select value={form.category_id} onChange={e => set("category_id", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400">
                <option value="">— Καμία —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Μονάδα</label>
              <select value={form.unit} onChange={e => set("unit", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Τοποθεσία</label>
              <select value={form.location_id} onChange={e => set("location_id", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400">
                {locations.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Ποσότητα</label>
              <input type="number" min="0" value={form.quantity} onChange={e => set("quantity", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Ελάχιστο απόθεμα</label>
            <input type="number" min="1" value={form.min_quantity} onChange={e => set("min_quantity", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Ακύρωση
            </button>
            <button type="submit" disabled={loading || !form.name.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Αποθήκευση
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
