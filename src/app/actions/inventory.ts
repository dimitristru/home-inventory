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

export async function searchProducts(query: string) {
  const { householdId } = await getSession();
  if (!householdId || query.length < 2) return [];
  const { data } = await admin()
    .from("products")
    .select("*, categories(*)")
    .eq("household_id", householdId)
    .ilike("name", `%${query}%`)
    .limit(6);
  return data ?? [];
}

export async function getLocations() {
  const { householdId } = await getSession();
  if (!householdId) return [];
  const { data } = await admin().from("locations").select("*").eq("household_id", householdId).order("name");
  return data ?? [];
}

export async function getCategories() {
  const { householdId } = await getSession();
  if (!householdId) return [];
  const { data } = await admin().from("categories").select("*").eq("household_id", householdId).order("name");
  return data ?? [];
}

export async function getInventory(locationId?: string) {
  const { householdId } = await getSession();
  if (!householdId) return [];

  let query = admin()
    .from("inventory")
    .select(`*, products!inner(*, categories(*)), locations(*)`)
    .eq("products.household_id", householdId);

  if (locationId) query = query.eq("location_id", locationId);

  const { data } = await query.order("quantity", { ascending: true });
  return data ?? [];
}

export async function addProduct(formData: {
  name: string; brand?: string; category_id?: string;
  unit: string; min_quantity: number; location_id: string; quantity: number;
}) {
  const { householdId, userId } = await getSession();
  if (!householdId) throw new Error("Δεν βρέθηκε νοικοκυριό");

  const { data: product, error: pErr } = await admin()
    .from("products")
    .insert({ household_id: householdId, name: formData.name, brand: formData.brand || null, category_id: formData.category_id || null, unit: formData.unit, min_quantity: formData.min_quantity })
    .select().single();
  if (pErr) throw new Error(pErr.message);

  const { error: iErr } = await admin()
    .from("inventory")
    .insert({ product_id: product.id, location_id: formData.location_id, quantity: formData.quantity, updated_by: userId });
  if (iErr) throw new Error(iErr.message);

  revalidatePath("/inventory");
}

export async function editProduct(productId: string, inventoryId: string, formData: {
  name: string; brand?: string; category_id?: string;
  unit: string; min_quantity: number; location_id: string; quantity: number;
}) {
  const { userId } = await getSession();

  await admin().from("products").update({
    name: formData.name,
    brand: formData.brand || null,
    category_id: formData.category_id || null,
    unit: formData.unit,
    min_quantity: formData.min_quantity,
  }).eq("id", productId);

  await admin().from("inventory").update({
    location_id: formData.location_id,
    quantity: formData.quantity,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }).eq("id", inventoryId);

  revalidatePath("/inventory");
}

export async function updateQuantity(inventoryId: string, delta: number) {
  const { userId, householdId } = await getSession();

  const { data: inv } = await admin()
    .from("inventory")
    .select("quantity, product_id, products(min_quantity, unit, name)")
    .eq("id", inventoryId)
    .single();
  if (!inv) throw new Error("Δεν βρέθηκε");

  const newQty = Math.max(0, inv.quantity + delta);
  await admin().from("inventory")
    .update({ quantity: newQty, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("id", inventoryId);

  const product = inv.products as { min_quantity: number; unit: string; name: string } | null;
  if (product && newQty <= product.min_quantity && delta < 0 && householdId) {
    const { data: list } = await admin()
      .from("shopping_lists")
      .select("id")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1).single();

    if (list) {
      const { data: existing } = await admin()
        .from("shopping_items")
        .select("id")
        .eq("list_id", list.id)
        .eq("product_id", inv.product_id)
        .eq("is_checked", false)
        .limit(1).single();

      if (!existing) {
        await admin().from("shopping_items").insert({
          list_id: list.id, product_id: inv.product_id,
          quantity: product.min_quantity, unit: product.unit, created_by: userId,
        });
        revalidatePath("/shopping");
      }
    }
  }

  revalidatePath("/inventory");
}

export async function createCategory(name: string, icon: string, color: string) {
  const { householdId } = await getSession();
  if (!householdId) throw new Error("Δεν βρέθηκε νοικοκυριό");
  const { data, error } = await admin().from("categories")
    .insert({ household_id: householdId, name, icon, color }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
  return data;
}

export async function createLocation(name: string, icon: string) {
  const { householdId } = await getSession();
  if (!householdId) throw new Error("Δεν βρέθηκε νοικοκυριό");
  const { data, error } = await admin().from("locations")
    .insert({ household_id: householdId, name, icon }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
  return data;
}

export async function deleteProduct(productId: string) {
  await getSession();
  await admin().from("products").delete().eq("id", productId);
  revalidatePath("/inventory");
}
