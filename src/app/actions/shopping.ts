"use server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

function admin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getSession() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Μη εξουσιοδοτημένος");
  const { data: profile } = await admin().from("profiles").select("household_id").eq("id", user.id).single();
  return { userId: user.id, householdId: profile?.household_id };
}

export async function getOrCreateActiveList() {
  const { householdId } = await getSession();
  if (!householdId) return null;

  const { data: existing } = await admin()
    .from("shopping_lists")
    .select("*")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing;

  const { data: created } = await admin()
    .from("shopping_lists")
    .insert({ household_id: householdId, name: "Λίστα αγορών" })
    .select()
    .single();

  return created;
}

export async function getShoppingItems(listId: string) {
  const { data } = await admin()
    .from("shopping_items")
    .select("*, products(name, unit, image_url, categories(icon, color))")
    .eq("list_id", listId)
    .order("is_checked")
    .order("created_at");
  return data ?? [];
}

export async function addShoppingItem(listId: string, item: {
  product_id?: string;
  custom_name?: string;
  quantity: number;
  unit?: string;
  notes?: string;
}) {
  const { userId } = await getSession();
  await admin().from("shopping_items").insert({
    list_id: listId,
    product_id: item.product_id ?? null,
    custom_name: item.custom_name ?? null,
    quantity: item.quantity,
    unit: item.unit ?? null,
    notes: item.notes ?? null,
    created_by: userId,
  });
  revalidatePath("/shopping");
}

export async function toggleItem(itemId: string, checked: boolean) {
  const { userId } = await getSession();
  await admin().from("shopping_items").update({
    is_checked: checked,
    checked_by: checked ? userId : null,
    checked_at: checked ? new Date().toISOString() : null,
  }).eq("id", itemId);
  revalidatePath("/shopping");
}

export async function editShoppingItem(itemId: string, data: { quantity: number; notes?: string; custom_name?: string }) {
  await getSession();
  await admin().from("shopping_items").update({
    quantity: data.quantity,
    notes: data.notes ?? null,
    custom_name: data.custom_name ?? null,
  }).eq("id", itemId);
  revalidatePath("/shopping");
}

export async function deleteShoppingItem(itemId: string) {
  await getSession();
  await admin().from("shopping_items").delete().eq("id", itemId);
  revalidatePath("/shopping");
}

export async function clearChecked(listId: string) {
  await getSession();
  await admin().from("shopping_items").delete().eq("list_id", listId).eq("is_checked", true);
  revalidatePath("/shopping");
}

// Auto-add low stock products to shopping list
export async function addLowStockToList(listId: string) {
  const { householdId } = await getSession();
  if (!householdId) return;

  // Get all inventory items where quantity <= min_quantity
  const { data: lowStock } = await admin()
    .from("inventory")
    .select("*, products!inner(*)")
    .eq("products.household_id", householdId)
    .filter("quantity", "lte", "min_quantity");

  if (!lowStock?.length) return;

  // Get existing items in list to avoid duplicates
  const { data: existing } = await admin()
    .from("shopping_items")
    .select("product_id")
    .eq("list_id", listId)
    .eq("is_checked", false);

  const existingIds = new Set(existing?.map(e => e.product_id));

  const toAdd = lowStock
    .filter(item => !existingIds.has(item.product_id))
    .map(item => ({
      list_id: listId,
      product_id: item.product_id,
      quantity: item.products.min_quantity,
      unit: item.products.unit,
    }));

  if (toAdd.length) {
    await admin().from("shopping_items").insert(toAdd);
    revalidatePath("/shopping");
  }

  return toAdd.length;
}

export async function searchProductsForShopping(query: string) {
  const { householdId } = await getSession();
  if (!householdId || query.length < 2) return [];
  const { data } = await admin()
    .from("products")
    .select("*, categories(icon, color)")
    .eq("household_id", householdId)
    .ilike("name", `%${query}%`)
    .limit(6);
  return data ?? [];
}
