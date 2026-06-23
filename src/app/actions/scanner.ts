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

// Βρες προϊόν με barcode
export async function findProductByBarcode(barcode: string) {
  const { householdId } = await getSession();
  if (!householdId) return null;

  const { data } = await admin()
    .from("products")
    .select("*, categories(*)")
    .eq("household_id", householdId)
    .eq("barcode", barcode)
    .single();

  if (!data) return null;

  // Βρες το inventory
  const { data: inventory } = await admin()
    .from("inventory")
    .select("*, locations(*)")
    .eq("product_id", data.id);

  return { product: data, inventory: inventory ?? [] };
}

// Αφαίρεσε 1 από συγκεκριμένη τοποθεσία
export async function scanOut(inventoryId: string, productId: string) {
  const { userId, householdId } = await getSession();

  const { data: inv } = await admin()
    .from("inventory")
    .select("quantity, products(min_quantity, unit, name)")
    .eq("id", inventoryId)
    .single();

  if (!inv) throw new Error("Δεν βρέθηκε");

  const newQty = Math.max(0, inv.quantity - 1);

  await admin().from("inventory").update({
    quantity: newQty,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }).eq("id", inventoryId);

  // Αν πέσει κάτω από min → πρόσθεσε στη λίστα αγορών
  const product = inv.products as { min_quantity: number; unit: string; name: string } | null;
  if (product && newQty <= product.min_quantity && householdId) {
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
        .eq("product_id", productId)
        .eq("is_checked", false)
        .limit(1).single();

      if (!existing) {
        await admin().from("shopping_items").insert({
          list_id: list.id,
          product_id: productId,
          quantity: product.min_quantity,
          unit: product.unit,
          created_by: userId,
        });
        revalidatePath("/shopping");
      }
    }
  }

  revalidatePath("/inventory");
  return { newQty, addedToList: product && newQty <= product.min_quantity };
}

// Αποθήκευσε barcode σε υπάρχον προϊόν
export async function saveBarcode(productId: string, barcode: string) {
  await getSession();
  await admin().from("products").update({ barcode }).eq("id", productId);
  revalidatePath("/inventory");
}

// Lookup barcode από Open Food Facts (δωρεάν API)
export async function lookupBarcode(barcode: string) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      next: { revalidate: 86400 }
    });
    const data = await res.json();
    if (data.status !== 1) return null;
    const p = data.product;
    return {
      name: p.product_name || p.product_name_el || null,
      brand: p.brands || null,
      image_url: p.image_url || null,
    };
  } catch {
    return null;
  }
}
