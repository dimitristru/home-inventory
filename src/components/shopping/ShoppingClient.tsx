"use client";
import { useState, useTransition, useRef } from "react";
import { Plus, Trash2, ShoppingCart, CheckCircle2, Circle, Loader2, TriangleAlert, Pencil, Check, X } from "lucide-react";
import {
  toggleItem, deleteShoppingItem, clearChecked,
  addShoppingItem, addLowStockToList, searchProductsForShopping, editShoppingItem
} from "@/app/actions/shopping";

type Item = {
  id: string;
  is_checked: boolean;
  quantity: number;
  unit: string | null;
  custom_name: string | null;
  notes: string | null;
  product_id: string | null;
  products: { name: string; unit: string; categories: { icon: string | null; color: string } | null } | null;
};

interface Props {
  listId: string;
  items: Item[];
  lowStockCount: number;
}

export default function ShoppingClient({ listId, items: initialItems, lowStockCount }: Props) {
  const [items, setItems] = useState(initialItems);
  const [input, setInput] = useState("");
  const [qty, setQty] = useState(1);
  const [suggestions, setSuggestions] = useState<Awaited<ReturnType<typeof searchProductsForShopping>>>([]);
  const [selectedProduct, setSelectedProduct] = useState<Awaited<ReturnType<typeof searchProductsForShopping>>[0] | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [, startTransition] = useTransition();
  const [addingLow, setAddingLow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ quantity: 1, notes: "", custom_name: "" });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unchecked = items.filter(i => !i.is_checked);
  const checked = items.filter(i => i.is_checked);

  function handleInputChange(val: string) {
    setInput(val);
    setSelectedProduct(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    searchTimer.current = setTimeout(async () => {
      const res = await searchProductsForShopping(val);
      setSuggestions(res);
      setShowSuggestions(res.length > 0);
    }, 250);
  }

  function pickSuggestion(p: typeof suggestions[0]) {
    setSelectedProduct(p);
    setInput(p.name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleAdd() {
    const name = input.trim();
    if (!name) return;
    const optimistic: Item = {
      id: `tmp-${Date.now()}`,
      is_checked: false,
      quantity: qty,
      unit: selectedProduct?.unit ?? null,
      custom_name: selectedProduct ? null : name,
      notes: null,
      product_id: selectedProduct?.id ?? null,
      products: selectedProduct ? {
        name: selectedProduct.name,
        unit: selectedProduct.unit,
        categories: selectedProduct.categories as Item["products"]["categories"],
      } : null,
    };
    setItems(prev => [optimistic, ...prev]);
    setInput("");
    setQty(1);
    setSelectedProduct(null);
    startTransition(() =>
      addShoppingItem(listId, {
        product_id: selectedProduct?.id,
        custom_name: selectedProduct ? undefined : name,
        quantity: qty,
        unit: selectedProduct?.unit,
      })
    );
  }

  function handleToggle(id: string, checked: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: checked } : i));
    startTransition(() => toggleItem(id, checked));
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    startTransition(() => deleteShoppingItem(id));
  }

  async function handleClearChecked() {
    setItems(prev => prev.filter(i => !i.is_checked));
    startTransition(() => clearChecked(listId));
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditForm({ quantity: item.quantity, notes: item.notes ?? "", custom_name: item.custom_name ?? "" });
  }

  async function saveEdit(item: Item) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: editForm.quantity, notes: editForm.notes || null, custom_name: editForm.custom_name || item.custom_name } : i));
    setEditingId(null);
    startTransition(() => editShoppingItem(item.id, { quantity: editForm.quantity, notes: editForm.notes, custom_name: item.custom_name ? editForm.custom_name : undefined }));
  }

  async function handleAddLowStock() {
    setAddingLow(true);
    const count = await addLowStockToList(listId);
    setAddingLow(false);
    if (count === 0) alert("Δεν υπάρχουν προϊόντα με χαμηλό απόθεμα που δεν είναι ήδη στη λίστα.");
  }

  function itemLabel(item: Item) {
    return item.products?.name ?? item.custom_name ?? "—";
  }

  function itemIcon(item: Item) {
    return item.products?.categories?.icon ?? "🛒";
  }

  function itemColor(item: Item) {
    return item.products?.categories?.color ?? "#6366f1";
  }

  return (
    <div className="space-y-4 pb-24 md:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Λίστα αγορών</h1>
          <p className="text-sm text-slate-500">
            {unchecked.length} αντικείμενα
            {checked.length > 0 && ` · ${checked.length} τσεκαρισμένα`}
          </p>
        </div>
        {lowStockCount > 0 && (
          <button
            onClick={handleAddLowStock}
            disabled={addingLow}
            className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors"
          >
            {addingLow ? <Loader2 size={14} className="animate-spin" /> : <TriangleAlert size={14} />}
            +{lowStockCount} χαμηλό απόθεμα
          </button>
        )}
      </div>

      {/* Quick add */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={e => handleInputChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="Προσθήκη αντικειμένου..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-400"
                autoComplete="off"
              />
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  {suggestions.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => pickSuggestion(p)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-emerald-50 text-left"
                    >
                      <span className="text-base">{(p.categories as { icon: string | null } | null)?.icon ?? "🛒"}</span>
                      <span className="text-sm font-medium text-slate-800">{p.name}</span>
                      <span className="ml-auto text-xs text-slate-400">{p.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number" min="1" value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="w-16 border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-800 text-center outline-none focus:border-emerald-400"
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim()}
              className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Unchecked items */}
      {unchecked.length === 0 && checked.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <div className="bg-emerald-50 p-4 rounded-full">
            <ShoppingCart size={32} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">Η λίστα είναι άδεια!</p>
            <p className="text-sm text-slate-500 mt-1">Γράψε κάτι παραπάνω ή πρόσθεσε χαμηλό απόθεμα</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {unchecked.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {editingId === item.id ? (
                <div className="p-3.5 space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-base">{itemIcon(item)}</span>
                    {item.custom_name ? (
                      <input
                        value={editForm.custom_name}
                        onChange={e => setEditForm(f => ({ ...f, custom_name: e.target.value }))}
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-800 outline-none focus:border-indigo-400"
                      />
                    ) : (
                      <span className="flex-1 text-sm font-medium text-slate-800">{itemLabel(item)}</span>
                    )}
                    <input
                      type="number" min="1"
                      value={editForm.quantity}
                      onChange={e => setEditForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-800 text-center outline-none focus:border-indigo-400"
                    />
                    <span className="text-xs text-slate-400">{item.unit ?? item.products?.unit ?? ""}</span>
                  </div>
                  <input
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Σημείωση (προαιρετικό)..."
                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="flex-1 border border-slate-200 rounded-lg py-1.5 text-xs text-slate-500 flex items-center justify-center gap-1 hover:bg-slate-50">
                      <X size={12} /> Ακύρωση
                    </button>
                    <button onClick={() => saveEdit(item)} className="flex-1 bg-indigo-600 text-white rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1 hover:bg-indigo-700">
                      <Check size={12} /> Αποθήκευση
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 flex items-center gap-3">
                  <button onClick={() => handleToggle(item.id, true)} className="text-slate-300 hover:text-emerald-500 transition-colors shrink-0">
                    <Circle size={22} />
                  </button>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0" style={{ backgroundColor: `${itemColor(item)}20` }}>
                    {itemIcon(item)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{itemLabel(item)}</p>
                    {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                  </div>
                  <span className="text-sm text-slate-500 shrink-0">{item.quantity} {item.unit ?? item.products?.unit ?? ""}</span>
                  <button onClick={() => startEdit(item)} className="text-slate-300 hover:text-indigo-400 transition-colors shrink-0">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Checked items */}
          {checked.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Τσεκαρισμένα ({checked.length})</p>
                <button onClick={handleClearChecked} className="text-xs text-red-400 hover:text-red-600">Καθαρισμός</button>
              </div>
              {checked.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 flex items-center gap-3 opacity-50">
                  <button onClick={() => handleToggle(item.id, false)} className="text-emerald-500 shrink-0">
                    <CheckCircle2 size={22} />
                  </button>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 bg-slate-100">
                    {itemIcon(item)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-500 line-through">{itemLabel(item)}</p>
                  </div>
                  <span className="text-sm text-slate-400 shrink-0">{item.quantity} {item.unit ?? item.products?.unit ?? ""}</span>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
