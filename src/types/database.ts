export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      households: {
        Row: { id: string; name: string; invite_code: string; created_at: string }
        Insert: { id?: string; name: string; invite_code?: string; created_at?: string }
        Update: { id?: string; name?: string; invite_code?: string }
      }
      profiles: {
        Row: { id: string; household_id: string | null; display_name: string | null; avatar_url: string | null; created_at: string }
        Insert: { id: string; household_id?: string | null; display_name?: string | null; avatar_url?: string | null }
        Update: { household_id?: string | null; display_name?: string | null; avatar_url?: string | null }
      }
      categories: {
        Row: { id: string; household_id: string; name: string; icon: string | null; color: string; budget_monthly: number | null; created_at: string }
        Insert: { id?: string; household_id: string; name: string; icon?: string | null; color?: string; budget_monthly?: number | null }
        Update: { name?: string; icon?: string | null; color?: string; budget_monthly?: number | null }
      }
      locations: {
        Row: { id: string; household_id: string; name: string; icon: string; created_at: string }
        Insert: { id?: string; household_id: string; name: string; icon?: string }
        Update: { name?: string; icon?: string }
      }
      products: {
        Row: { id: string; household_id: string; name: string; brand: string | null; barcode: string | null; category_id: string | null; unit: string; min_quantity: number; image_url: string | null; notes: string | null; created_at: string }
        Insert: { id?: string; household_id: string; name: string; brand?: string | null; barcode?: string | null; category_id?: string | null; unit?: string; min_quantity?: number; image_url?: string | null; notes?: string | null }
        Update: { name?: string; brand?: string | null; barcode?: string | null; category_id?: string | null; unit?: string; min_quantity?: number; image_url?: string | null; notes?: string | null }
      }
      inventory: {
        Row: { id: string; product_id: string; location_id: string; quantity: number; updated_at: string; updated_by: string | null }
        Insert: { id?: string; product_id: string; location_id: string; quantity?: number; updated_by?: string | null }
        Update: { quantity?: number; updated_at?: string; updated_by?: string | null }
      }
      shopping_lists: {
        Row: { id: string; household_id: string; name: string; is_active: boolean; created_at: string; created_by: string | null }
        Insert: { id?: string; household_id: string; name?: string; is_active?: boolean; created_by?: string | null }
        Update: { name?: string; is_active?: boolean }
      }
      shopping_items: {
        Row: { id: string; list_id: string; product_id: string | null; custom_name: string | null; quantity: number; unit: string | null; is_checked: boolean; checked_by: string | null; checked_at: string | null; notes: string | null; created_at: string; created_by: string | null }
        Insert: { id?: string; list_id: string; product_id?: string | null; custom_name?: string | null; quantity?: number; unit?: string | null; notes?: string | null; created_by?: string | null }
        Update: { quantity?: number; is_checked?: boolean; checked_by?: string | null; checked_at?: string | null; notes?: string | null }
      }
      purchases: {
        Row: { id: string; household_id: string; store_name: string | null; total_amount: number | null; purchased_at: string; receipt_image_url: string | null; notes: string | null; created_by: string | null }
        Insert: { id?: string; household_id: string; store_name?: string | null; total_amount?: number | null; purchased_at?: string; receipt_image_url?: string | null; notes?: string | null; created_by?: string | null }
        Update: { store_name?: string | null; total_amount?: number | null; purchased_at?: string; receipt_image_url?: string | null; notes?: string | null }
      }
      purchase_items: {
        Row: { id: string; purchase_id: string; product_id: string | null; custom_name: string | null; quantity: number | null; unit: string | null; price_per_unit: number | null; total_price: number | null; category_id: string | null }
        Insert: { id?: string; purchase_id: string; product_id?: string | null; custom_name?: string | null; quantity?: number | null; unit?: string | null; price_per_unit?: number | null; total_price?: number | null; category_id?: string | null }
        Update: { quantity?: number | null; price_per_unit?: number | null; total_price?: number | null }
      }
    }
  }
}

// Convenience types
export type Household = Database['public']['Tables']['households']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Inventory = Database['public']['Tables']['inventory']['Row']
export type ShoppingList = Database['public']['Tables']['shopping_lists']['Row']
export type ShoppingItem = Database['public']['Tables']['shopping_items']['Row']
export type Purchase = Database['public']['Tables']['purchases']['Row']
export type PurchaseItem = Database['public']['Tables']['purchase_items']['Row']

export type InventoryWithProduct = Inventory & { products: Product & { categories: Category | null } }
export type ShoppingItemWithProduct = ShoppingItem & { products: Pick<Product, 'id' | 'name' | 'unit' | 'image_url'> | null }
