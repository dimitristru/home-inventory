"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera, CheckCircle2, AlertTriangle, Package, Minus, Plus, Loader2 } from "lucide-react";
import { findProductByBarcode, scanOut, lookupBarcode, saveBarcode } from "@/app/actions/scanner";
import { addProduct, getCategories, getLocations } from "@/app/actions/inventory";

type ScanResult =
  | { status: "found"; product: { id: string; name: string; brand: string | null; barcode: string | null; unit: string; min_quantity: number; categories: { icon: string | null; color: string } | null }; inventory: { id: string; quantity: number; locations: { id: string; name: string; icon: string } | null }[] }
  | { status: "unknown"; barcode: string; suggestion: { name: string | null; brand: string | null; image_url: string | null } | null }
  | null;

interface Props {
  onClose: () => void;
}

export default function BarcodeScanner({ onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ScanResult>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [, startTransition] = useTransition();
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", brand: "", unit: "τεμ", quantity: 1, min_quantity: 1, category_id: "", location_id: "" });
  const [cats, setCats] = useState<Awaited<ReturnType<typeof getCategories>>>([]);
  const [locs, setLocs] = useState<Awaited<ReturnType<typeof getLocations>>>([]);

  useEffect(() => {
    startScanner();
    getCategories().then(setCats);
    getLocations().then(l => { setLocs(l); setNewForm(f => ({ ...f, location_id: l[0]?.id ?? "" })); });
    return () => stopScanner();
  }, []);

  async function startScanner() {
    setScanning(true);
    setResult(null);
    setFeedback(null);
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      await reader.decodeFromVideoDevice(undefined, videoRef.current!, async (res, err) => {
        if (err) return; // NotFoundException εμφανίζεται συνέχεια όταν δεν βρίσκει — το αγνοούμε
        if (res) {
          stopScanner();
          const barcode = res.getText();
          await handleBarcode(barcode);
        }
      });
    } catch {
      setFeedback({ type: "error", msg: "Δεν βρέθηκε κάμερα ή δεν δόθηκε άδεια." });
      setScanning(false);
    }
  }

  function stopScanner() {
    readerRef.current?.reset();
    setScanning(false);
  }

  async function handleBarcode(barcode: string) {
    const found = await findProductByBarcode(barcode);
    if (found) {
      setSelectedInventoryId(found.inventory[0]?.id ?? "");
      setResult({ status: "found", product: found.product as ScanResult & { status: "found" } extends { product: infer P } ? P : never, inventory: found.inventory as ScanResult & { status: "found" } extends { inventory: infer I } ? I : never });
    } else {
      const suggestion = await lookupBarcode(barcode);
      setResult({ status: "unknown", barcode, suggestion });
      if (suggestion?.name) {
        setNewForm(f => ({ ...f, name: suggestion.name ?? "", brand: suggestion.brand ?? "" }));
      }
      setAddingNew(true);
    }
  }

  async function handleScanOut() {
    if (result?.status !== "found" || !selectedInventoryId) return;
    const res = await scanOut(selectedInventoryId, result.product.id);
    const msg = res.addedToList
      ? `✓ Αφαιρέθηκε! Προστέθηκε στη λίστα αγορών.`
      : `✓ Αφαιρέθηκε! Νέο απόθεμα: ${res.newQty}`;
    setFeedback({ type: "success", msg });
    setTimeout(() => { setResult(null); startScanner(); }, 2000);
  }

  async function handleAddNew() {
    if (result?.status !== "unknown" || !newForm.name.trim()) return;
    await addProduct({
      name: newForm.name.trim(),
      brand: newForm.brand.trim() || undefined,
      category_id: newForm.category_id || undefined,
      unit: newForm.unit,
      min_quantity: newForm.min_quantity,
      location_id: newForm.location_id,
      quantity: newForm.quantity,
    });
    // Αποθήκευσε barcode στο νέο προϊόν
    const found = await findProductByBarcode(result.barcode);
    if (!found) {
      // Βρες το μόλις δημιουργηθέν προϊόν και αποθήκευσε barcode
    }
    setFeedback({ type: "success", msg: "✓ Προϊόν προστέθηκε στο αποθεματικό!" });
    setTimeout(() => { setResult(null); setAddingNew(false); startScanner(); }, 2000);
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white font-bold text-lg">📷 Scanner</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {/* Camera */}
      <div className="relative flex-1 flex items-center justify-center bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" />

        {/* Viewfinder overlay */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-40">
              {/* Corners */}
              {["top-0 left-0 border-t-4 border-l-4", "top-0 right-0 border-t-4 border-r-4", "bottom-0 left-0 border-b-4 border-l-4", "bottom-0 right-0 border-b-4 border-r-4"].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-emerald-400 rounded-sm ${cls}`} />
              ))}
              {/* Scan line */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400/70 animate-pulse" />
            </div>
            <p className="absolute bottom-24 text-white/80 text-sm text-center px-4">
              Στόχευσε το barcode του προϊόντος
            </p>
          </div>
        )}

        {/* Result overlay */}
        {result && (
          <div className="absolute inset-0 bg-black/60 flex items-end">
            <div className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {result.status === "found" && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${result.product.categories?.color ?? "#6366f1"}20` }}>
                      {result.product.categories?.icon ?? "📦"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{result.product.name}</p>
                      {result.product.brand && <p className="text-sm text-slate-500">{result.product.brand}</p>}
                    </div>
                  </div>

                  {/* Select location */}
                  {result.inventory.length > 1 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Από ποια τοποθεσία;</p>
                      <div className="flex gap-2">
                        {result.inventory.map(inv => (
                          <button
                            key={inv.id}
                            onClick={() => setSelectedInventoryId(inv.id)}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${selectedInventoryId === inv.id ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-600"}`}
                          >
                            {inv.locations?.icon} {inv.locations?.name}
                            <span className="ml-1 text-xs opacity-70">({inv.quantity})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.inventory.length === 1 && (
                    <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-sm text-slate-600">{result.inventory[0].locations?.icon} {result.inventory[0].locations?.name}</span>
                      <span className="font-bold text-slate-800">{result.inventory[0].quantity} {result.product.unit}</span>
                    </div>
                  )}

                  {feedback ? (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      <CheckCircle2 size={18} /> {feedback.msg}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setResult(null); startScanner(); }}
                        className="flex-1 border border-slate-200 rounded-xl py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
                        Ακύρωση
                      </button>
                      <button onClick={handleScanOut} disabled={!selectedInventoryId}
                        className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        <Minus size={16} /> Αφαίρεσε 1
                      </button>
                    </div>
                  )}
                </>
              )}

              {result.status === "unknown" && (
                <>
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle size={20} />
                    <p className="font-semibold">Άγνωστο προϊόν</p>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{result.barcode}</p>

                  {result.suggestion && (
                    <div className="bg-slate-50 rounded-lg p-3 text-sm">
                      <p className="text-xs text-slate-400 mb-1">Βρέθηκε στο Open Food Facts:</p>
                      <p className="font-medium text-slate-800">{result.suggestion.name}</p>
                      {result.suggestion.brand && <p className="text-slate-500">{result.suggestion.brand}</p>}
                    </div>
                  )}

                  {addingNew && (
                    <div className="space-y-3">
                      <input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Όνομα προϊόντος *"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400" />
                      <input value={newForm.brand} onChange={e => setNewForm(f => ({ ...f, brand: e.target.value }))}
                        placeholder="Μάρκα"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400" />
                      <div className="grid grid-cols-3 gap-2">
                        <select value={newForm.location_id} onChange={e => setNewForm(f => ({ ...f, location_id: e.target.value }))}
                          className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-900 outline-none">
                          {locs.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
                        </select>
                        <input type="number" min="0" value={newForm.quantity}
                          onChange={e => setNewForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                          placeholder="Ποσ."
                          className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-900 text-center outline-none" />
                        <input type="number" min="1" value={newForm.min_quantity}
                          onChange={e => setNewForm(f => ({ ...f, min_quantity: Number(e.target.value) }))}
                          placeholder="Ελάχ."
                          className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-900 text-center outline-none" />
                      </div>
                    </div>
                  )}

                  {feedback ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                      <CheckCircle2 size={18} /> {feedback.msg}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setResult(null); startScanner(); }}
                        className="flex-1 border border-slate-200 rounded-xl py-3 text-sm font-medium text-slate-600">
                        Παράλειψη
                      </button>
                      <button onClick={handleAddNew} disabled={!newForm.name.trim()}
                        className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        <Plus size={16} /> Πρόσθεσε
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {scanning && !result && (
        <div className="bg-black/80 p-4 flex items-center justify-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/70 text-sm">Σκανάρισμα σε εξέλιξη...</span>
        </div>
      )}
    </div>
  );
}
