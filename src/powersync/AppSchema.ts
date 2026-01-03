import { column, Schema, Table } from "@powersync/web";

// ============================================
// TABLE NAMES - Constants for table references
// ============================================
export const CASHIERS_TABLE = "cashiers";
export const CATEGORIES_TABLE = "categories";
export const PRODUCTS_TABLE = "products";
export const SALES_TABLE = "sales";
export const SALE_ITEMS_TABLE = "sale_items";

// ============================================
// TABLE DEFINITIONS
// ============================================

/**
 * Cashiers table - Staff members who can operate the POS
 * PIN authentication for quick login
 */
const cashiers = new Table({
  name: column.text,
  pin_hash: column.text,
  is_active: column.integer, // SQLite boolean as 0/1
  created_at: column.text,
});

/**
 * Categories table - Product organization
 * Used for catalog navigation
 */
const categories = new Table({
  name: column.text,
  description: column.text,
  image_url: column.text,
  sort_order: column.integer,
  created_at: column.text,
});

/**
 * Products table - Items available for sale
 * Contains pricing, inventory, and display info
 */
const products = new Table({
  category_id: column.text,
  name: column.text,
  sku: column.text,
  price: column.real, // Decimal stored as real
  image_url: column.text,
  stock_quantity: column.integer,
  is_active: column.integer, // SQLite boolean as 0/1
  created_at: column.text,
});

/**
 * Sales table - Transaction headers
 * Tracks the overall sale with status workflow
 */
const sales = new Table({
  cashier_id: column.text,
  total_amount: column.real, // Decimal stored as real
  status: column.text, // 'draft' | 'completed' | 'voided'
  created_at: column.text,
  completed_at: column.text,
});

/**
 * Sale Items table - Line items within a sale
 * Each item links to a product with quantity and pricing
 */
const sale_items = new Table({
  sale_id: column.text,
  product_id: column.text,
  quantity: column.integer,
  unit_price: column.real,
  subtotal: column.real,
  created_at: column.text,
});

// ============================================
// SCHEMA DEFINITION
// ============================================

/**
 * PowerSync Schema - Defines all tables for local SQLite and sync
 * This schema is used for:
 * 1. Creating local SQLite tables
 * 2. Defining sync rules structure
 * 3. Generating TypeScript types
 */
export const AppSchema = new Schema({
  cashiers,
  categories,
  products,
  sales,
  sale_items,
});

// ============================================
// TYPE EXPORTS
// ============================================

/** Database type containing all table types */
export type Database = (typeof AppSchema)["types"];

/** Cashier record type */
export type CashierRecord = Database["cashiers"];

/** Category record type */
export type CategoryRecord = Database["categories"];

/** Product record type */
export type ProductRecord = Database["products"];

/** Sale record type */
export type SaleRecord = Database["sales"];

/** Sale item record type */
export type SaleItemRecord = Database["sale_items"];
