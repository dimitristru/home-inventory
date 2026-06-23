import { getOrCreateActiveList, getShoppingItems } from "@/app/actions/shopping";
import { getInventory } from "@/app/actions/inventory";
import ShoppingClient from "@/components/shopping/ShoppingClient";
import { ShoppingCart } from "lucide-react";

export default async function ShoppingPage() {
  const list = await getOrCreateActiveList();

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <ShoppingCart size={40} className="text-slate-300" />
        <p className="text-slate-500">Πρέπει να συνδεθείς πρώτα</p>
      </div>
    );
  }

  const [items, inventory] = await Promise.all([
    getShoppingItems(list.id),
    getInventory(),
  ]);

  const lowStockCount = inventory.filter(
    (i: { quantity: number; products: { min_quantity: number } }) => i.quantity <= i.products.min_quantity
  ).length;

  return (
    <ShoppingClient
      listId={list.id}
      items={items as Parameters<typeof ShoppingClient>[0]["items"]}
      lowStockCount={lowStockCount}
    />
  );
}
