"use client";
import { useState, useRef } from "react";
import { X, Loader2, Plus, Check } from "lucide-react";
import { addProduct, createCategory, createLocation, searchProducts } from "@/app/actions/inventory";
import type { Category, Location } from "@/types/database";

interface Props {
  categories: Category[];
  locations: Location[];
  onClose: () => void;
}

const UNITS = ["τεμ", "κιλά", "γρ", "λίτρα", "ml", "πακέτο", "κουτί"];
const ICONS = [
  // Φαγητό & ποτά
  "🛒", "🍎", "🥩", "🐟", "🧀", "🥚", "🥦", "🍞", "🧃", "🥤", "🍷", "☕",
  // Καθαριότητα & σπίτι
  "🧹", "🧺", "🧻", "🧼", "🫧", "🪣", "🧽", "🪥",
  // Προσωπική φροντίδα
  "🧴", "💊", "🩺", "🪒", "💄", "🧖",
  // Αποθήκη & διάφορα
  "📦", "🏠", "🔧", "💡", "🔋", "🖨️", "📄",
  // Κατοικίδια
  "🐾", "🐕", "🐈",
  // Παιδιά
  "🧸", "🎒", "✏️",
];
const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#6b7280"];

const LOC_ICONS = ["🏠", "📦", "🧊", "🚪", "🛁", "🛏️", "🧹", "🚗", "🏪", "📋"];

export default function AddProductModal({ categories: initialCategories, locations: initialLocations, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState(initialCategories);
  const [locations, setLocations] = useState(initialLocations);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: "", icon: "🏠" });
  const [savingLoc, setSavingLoc] = useState(false);
  const [suggestions, setSuggestions] = useState<Awaited<ReturnType<typeof searchProducts>>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newCat, setNewCat] = useState({ name: "", icon: "📦", color: "#6b7280" });
  const [savingCat, setSavingCat] = useState(false);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    category_id: "",
    unit: "τεμ",
    min_quantity: 1,
    location_id: locations[0]?.id ?? "",
    quantity: 1,
  });

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSaveLocation() {
    if (!newLoc.name.trim()) return;
    setSavingLoc(true);
    try {
      const created = await createLocation(newLoc.name.trim(), newLoc.icon);
      setLocations(prev => [...prev, created]);
      setForm(f => ({ ...f, location_id: created.id }));
      setShowNewLocation(false);
      setNewLoc({ name: "", icon: "🏠" });
    } finally {
      setSavingLoc(false);
    }
  }

  function handleNameChange(value: string) {
    set("name", value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    searchTimer.current = setTimeout(async () => {
      const results = await searchProducts(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 250);
  }

  function applySuggestion(product: Awaited<ReturnType<typeof searchProducts>>[0]) {
    setForm(f => ({
      ...f,
      name: product.name,
      brand: product.brand ?? "",
      category_id: product.category_id ?? "",
      unit: product.unit,
      min_quantity: product.min_quantity,
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleSaveCategory() {
    if (!newCat.name.trim()) return;
    setSavingCat(true);
    try {
      const created = await createCategory(newCat.name.trim(), newCat.icon, newCat.color);
      setCategories(prev => [...prev, created]);
      setForm(f => ({ ...f, category_id: created.id }));
      setShowNewCategory(false);
      setNewCat({ name: "", icon: "📦", color: "#6b7280" });
    } finally {
      setSavingCat(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await addProduct({
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
          <h2 className="font-bold text-slate-800 text-lg">Νέο προϊόν</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="relative">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Όνομα *</label>
            <input
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="π.χ. Γάλα εβαπορέ"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400"
              autoFocus
              autoComplete="off"
            />
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                {suggestions.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => applySuggestion(p)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-indigo-50 text-left transition-colors"
                  >
                    <span className="text-lg">
                      {(p.categories as { icon: string | null } | null)?.icon ?? "📦"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      {p.brand && <p className="text-xs text-slate-400">{p.brand} · {p.unit}</p>}
                    </div>
                    <span className="ml-auto text-xs text-indigo-400 shrink-0">autofill</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Μάρκα</label>
            <input
              value={form.brand}
              onChange={e => set("brand", e.target.value)}
              placeholder="π.χ. Νουνού"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400"
            />
          </div>

          {/* Category with inline add */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Κατηγορία</label>
            <div className="flex gap-2">
              <select
                value={form.category_id}
                onChange={e => set("category_id", e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
              >
                <option value="">— Καμία —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCategory(v => !v)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-sm flex items-center gap-1"
              >
                <Plus size={14} />
                Νέα
              </button>
            </div>

            {/* Inline new category form */}
            {showNewCategory && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <input
                  value={newCat.name}
                  onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))}
                  placeholder="Όνομα κατηγορίας"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400 bg-white"
                  autoFocus
                />
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Εικονίδιο</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCat(n => ({ ...n, icon }))}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors ${newCat.icon === icon ? "bg-indigo-100 ring-2 ring-indigo-400" : "bg-white border border-slate-200 hover:bg-slate-100"}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Χρώμα</p>
                  <div className="flex gap-1.5">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCat(n => ({ ...n, color }))}
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: color, borderColor: newCat.color === color ? "#1e293b" : "transparent" }}
                      >
                        {newCat.color === color && <Check size={12} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="flex-1 border border-slate-200 rounded-lg py-1.5 text-xs text-slate-500 hover:bg-white"
                  >
                    Ακύρωση
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCategory}
                    disabled={savingCat || !newCat.name.trim()}
                    className="flex-1 bg-indigo-600 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {savingCat ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Αποθήκευση
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Μονάδα</label>
              <select
                value={form.unit}
                onChange={e => set("unit", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Τοποθεσία</label>
              <div className="flex gap-1.5">
                <select
                  value={form.location_id}
                  onChange={e => set("location_id", e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 min-w-0"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.icon} {l.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewLocation(v => !v)}
                  className="px-2 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 flex items-center"
                >
                  <Plus size={14} />
                </button>
              </div>
              {showNewLocation && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <input
                    value={newLoc.name}
                    onChange={e => setNewLoc(n => ({ ...n, name: e.target.value }))}
                    placeholder="π.χ. Ψυγείο"
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400 bg-white"
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {LOC_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewLoc(n => ({ ...n, icon }))}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors ${newLoc.icon === icon ? "bg-indigo-100 ring-2 ring-indigo-400" : "bg-white border border-slate-200 hover:bg-slate-100"}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowNewLocation(false)} className="flex-1 border border-slate-200 rounded-lg py-1.5 text-xs text-slate-500 hover:bg-white">
                      Ακύρωση
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLocation}
                      disabled={savingLoc || !newLoc.name.trim()}
                      className="flex-1 bg-indigo-600 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {savingLoc ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Αποθήκευση
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Ποσότητα</label>
              <input
                type="number" min="0"
                value={form.quantity}
                onChange={e => set("quantity", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Ελάχιστο απόθεμα</label>
              <input
                type="number" min="1"
                value={form.min_quantity}
                onChange={e => set("min_quantity", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Αποθήκευση
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
