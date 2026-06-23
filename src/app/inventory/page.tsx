import { getInventory, getCategories, getLocations } from "@/app/actions/inventory";
import InventoryClient from "@/components/inventory/InventoryClient";

export default async function InventoryPage() {
  const [inventory, categories, locations] = await Promise.all([
    getInventory(),
    getCategories(),
    getLocations(),
  ]);

  return (
    <InventoryClient
      inventory={inventory as Parameters<typeof InventoryClient>[0]["inventory"]}
      categories={categories}
      locations={locations}
    />
  );
}
