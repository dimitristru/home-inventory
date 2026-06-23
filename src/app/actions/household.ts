"use server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminClient(): any {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserId(): Promise<string> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c: any[]) => c.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Δεν βρέθηκε χρήστης");
  return user.id;
}

export async function createHousehold(householdName: string) {
  const userId = await getUserId();
  const db = adminClient();

  const { data: household, error: hErr } = await db
    .from("households")
    .insert({ name: householdName })
    .select()
    .single();
  if (hErr) throw new Error(hErr.message);

  const { error: pErr } = await db
    .from("profiles")
    .update({ household_id: household.id })
    .eq("id", userId);
  if (pErr) throw new Error(pErr.message);

  await db.from("categories").insert([
    { household_id: household.id, name: "Φαγητό", icon: "🛒", color: "#22c55e" },
    { household_id: household.id, name: "Καθαριστικά", icon: "🧹", color: "#3b82f6" },
    { household_id: household.id, name: "Προσωπική φροντίδα", icon: "🧴", color: "#a855f7" },
    { household_id: household.id, name: "Ποτά", icon: "🥤", color: "#f59e0b" },
    { household_id: household.id, name: "Άλλο", icon: "📦", color: "#6b7280" },
  ]);

  await db.from("locations").insert([
    { household_id: household.id, name: "Σπίτι", icon: "🏠" },
    { household_id: household.id, name: "Αποθήκη", icon: "📦" },
  ]);

  return household;
}

export async function joinHousehold(code: string) {
  const userId = await getUserId();
  const db = adminClient();

  const { data: household, error } = await db
    .from("households")
    .select()
    .eq("invite_code", code.trim().toLowerCase())
    .single();
  if (error || !household) throw new Error("Ο κωδικός δεν βρέθηκε");

  const { error: pErr } = await db
    .from("profiles")
    .update({ household_id: household.id })
    .eq("id", userId);
  if (pErr) throw new Error(pErr.message);

  return household;
}
