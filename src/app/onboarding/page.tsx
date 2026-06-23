"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Users, ArrowRight, Loader2 } from "lucide-react";
import { createHousehold as createHouseholdAction, joinHousehold as joinHouseholdAction } from "@/app/actions/household";

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createHousehold() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await createHouseholdAction(name.trim());
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setLoading(false);
    }
  }

  async function joinHousehold() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      await joinHouseholdAction(code.trim());
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Κάτι πήγε στραβά");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-sm space-y-6">
        {mode === "choose" && (
          <>
            <div className="text-center">
              <div className="text-4xl mb-3">👋</div>
              <h1 className="text-xl font-bold text-slate-800">Καλωσήρθες!</h1>
              <p className="text-sm text-slate-500 mt-1">Πώς θέλεις να ξεκινήσεις;</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setMode("create")}
                className="w-full flex items-center gap-3 border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Home size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Δημιουργία νοικοκυριού</p>
                  <p className="text-xs text-slate-500">Νέο σπίτι, νέα αρχή</p>
                </div>
                <ArrowRight size={16} className="text-slate-300 ml-auto" />
              </button>
              <button
                onClick={() => setMode("join")}
                className="w-full flex items-center gap-3 border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <Users size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Σύνδεση με υπάρχον</p>
                  <p className="text-xs text-slate-500">Έχεις κωδικό πρόσκλησης;</p>
                </div>
                <ArrowRight size={16} className="text-slate-300 ml-auto" />
              </button>
            </div>
          </>
        )}

        {mode === "create" && (
          <>
            <div>
              <button onClick={() => setMode("choose")} className="text-sm text-slate-500 hover:text-slate-700 mb-4">← Πίσω</button>
              <h1 className="text-xl font-bold text-slate-800">Νέο νοικοκυριό</h1>
              <p className="text-sm text-slate-500 mt-1">Βάλε ένα όνομα για το σπίτι σου</p>
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="π.χ. Σπίτι Δημήτρη"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              onKeyDown={e => e.key === "Enter" && createHousehold()}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={createHousehold}
              disabled={loading || !name.trim()}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Δημιουργία
            </button>
          </>
        )}

        {mode === "join" && (
          <>
            <div>
              <button onClick={() => setMode("choose")} className="text-sm text-slate-500 hover:text-slate-700 mb-4">← Πίσω</button>
              <h1 className="text-xl font-bold text-slate-800">Σύνδεση νοικοκυριού</h1>
              <p className="text-sm text-slate-500 mt-1">Βάλε τον κωδικό πρόσκλησης</p>
            </div>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="π.χ. a1b2c3d4"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 font-mono"
              onKeyDown={e => e.key === "Enter" && joinHousehold()}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={joinHousehold}
              disabled={loading || !code.trim()}
              className="w-full bg-emerald-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Σύνδεση
            </button>
          </>
        )}
      </div>
    </div>
  );
}
