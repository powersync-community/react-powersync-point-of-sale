import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { eq, and } from "@tanstack/db";
import { powerSync } from "@/powersync/System";
import { SALES_TABLE, SALE_ITEMS_TABLE } from "@/powersync/AppSchema";
import { generateId } from "@/lib/utils";
import type { Product } from "@/collections/products";
import {
  salesCollection,
  saleItemsCollection,
  productsCollection,
} from "@/collections";
import { useAuth } from "./auth-context";

/** Cart item with product info and quantity */
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Cart context state and methods */
interface CartContextType {
  /** Items in the cart */
  items: CartItem[];
  /** Total number of items */
  itemCount: number;
  /** Total cart amount */
  total: number;
  /** Current sale ID (if draft exists) */
  saleId: string | null;
  /** Add product to cart */
  addItem: (product: Product) => void;
  /** Update item quantity */
  updateQuantity: (productId: string, quantity: number) => void;
  /** Remove item from cart */
  removeItem: (productId: string) => void;
  /** Clear all items */
  clearCart: () => void;
  /** Complete the sale */
  completeSale: () => Promise<string | null>;
  /** Whether cart is processing */
  isProcessing: boolean;
  /** Whether cart is loading from DB */
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

/**
 * Hook to access cart context
 * @throws Error if used outside CartProvider
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

/**
 * Cart Provider component
 * Manages shopping cart state and persists sales to PowerSync local database
 *
 * Each client can only have ONE draft sale at a time.
 * Uses TanStack DB live queries for reactive updates.
 */
export function CartProvider({ children }: CartProviderProps) {
  const { cashier } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Live query for the cashier's single draft sale
  // Each client should only have ONE draft sale at a time
  const { data: draftSales = [], isLoading: salesLoading } = useLiveQuery(
    (q) =>
      q
        .from({ sale: salesCollection })
        .where(({ sale }) =>
          and(
            eq(sale.cashier_id, cashier?.id ?? ""),
            eq(sale.status, "draft")
          )
        ),
    [cashier?.id]
  );

  // Get the current draft sale - should be exactly 0 or 1
  const draftSale = draftSales.length > 0 ? draftSales[0] : null;
  const currentSaleId = draftSale?.id ?? null;

  // Live query for sale items - only when we have a draft sale
  const { data: rawSaleItems = [], isLoading: itemsLoading } = useLiveQuery(
    (q) =>
      q
        .from({ si: saleItemsCollection })
        .where(({ si }) => eq(si.sale_id, currentSaleId ?? ""))
        .orderBy(({ si }) => si.created_at, "asc"),
    [currentSaleId]
  );

  // Live query for all products (for joining with sale items)
  const { data: products = [] } = useLiveQuery((q) =>
    q.from({ p: productsCollection })
  );

  // Create a product lookup map
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  // Transform sale items to CartItem format with product info
  const items: CartItem[] = useMemo(() => {
    if (!currentSaleId) return [];

    return rawSaleItems
      .map((item) => {
        const product = item.product_id
          ? productMap.get(item.product_id)
          : null;
        if (!product) return null;

        return {
          id: item.id,
          product: product as Product,
          quantity: item.quantity ?? 0,
          unitPrice: item.unit_price ?? 0,
          subtotal: item.subtotal ?? 0,
        };
      })
      .filter((item): item is CartItem => item !== null);
  }, [rawSaleItems, productMap, currentSaleId]);

  const isLoading = salesLoading || itemsLoading;

  /** Calculate total item count */
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  /** Calculate total amount */
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  );

  /**
   * Get or create the single draft sale for this cashier
   * Enforces the one-draft-per-client rule
   */
  const getOrCreateDraftSale = useCallback(async (): Promise<string> => {
    if (!cashier) {
      throw new Error("No cashier logged in");
    }

    // If we already have a draft sale from the live query, use it
    if (currentSaleId) {
      return currentSaleId;
    }

    // Double-check database (in case live query hasn't updated yet)
    const existingDraft = await powerSync
      .get<{ id: string }>(
        `SELECT id FROM ${SALES_TABLE} WHERE cashier_id = ? AND status = 'draft' LIMIT 1`,
        [cashier.id]
      )
      .catch(() => null);

    if (existingDraft) {
      return existingDraft.id;
    }

    // Create the single draft sale for this client
    const newSaleId = generateId();
    const now = new Date().toISOString();

    await powerSync.execute(
      `INSERT INTO ${SALES_TABLE} (id, cashier_id, total_amount, status, created_at) 
       VALUES (?, ?, ?, 'draft', ?)`,
      [newSaleId, cashier.id, 0, now]
    );

    return newSaleId;
  }, [cashier, currentSaleId]);

  /**
   * Add product to cart - persists to local database
   * Uses a transaction to ensure item update and total recalculation are atomic
   */
  const addItem = useCallback(
    async (product: Product) => {
      if (!cashier) return;

      try {
        const saleId = await getOrCreateDraftSale();

        await powerSync.writeTransaction(async (tx) => {
          // Check if product already exists in cart
          const existingItem = await tx
            .get<{ id: string; quantity: number; unit_price: number }>(
              `SELECT id, quantity, unit_price FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ? AND product_id = ?`,
              [saleId, product.id]
            )
            .catch(() => null);

          if (existingItem) {
            // Update existing item quantity using UPDATE (not DELETE+INSERT)
            const newQuantity = existingItem.quantity + 1;
            const newSubtotal = newQuantity * existingItem.unit_price;

            await tx.execute(
              `UPDATE ${SALE_ITEMS_TABLE} SET quantity = ?, subtotal = ? WHERE id = ?`,
              [newQuantity, newSubtotal, existingItem.id]
            );
          } else {
            // Add new item
            const itemId = generateId();
            const now = new Date().toISOString();

            await tx.execute(
              `INSERT INTO ${SALE_ITEMS_TABLE} (id, sale_id, product_id, quantity, unit_price, subtotal, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [itemId, saleId, product.id, 1, product.price, product.price, now]
            );
          }

          // Recalculate and update total within the same transaction
          const result = await tx.get<{ total: number }>(
            `SELECT COALESCE(SUM(subtotal), 0) as total FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ?`,
            [saleId]
          );
          const newTotal = result?.total ?? 0;

          await tx.execute(
            `UPDATE ${SALES_TABLE} SET total_amount = ? WHERE id = ?`,
            [newTotal, saleId]
          );
        });
      } catch (err) {
        console.error("Error adding item to cart:", err);
      }
    },
    [cashier, getOrCreateDraftSale]
  );

  /**
   * Update item quantity - persists to local database
   * Uses a transaction to ensure item update and total recalculation are atomic
   */
  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!currentSaleId) return;

      try {
        await powerSync.writeTransaction(async (tx) => {
          // Get existing item
          const existingItem = await tx
            .get<{ id: string; unit_price: number }>(
              `SELECT id, unit_price FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ? AND product_id = ?`,
              [currentSaleId, productId]
            )
            .catch(() => null);

          if (!existingItem) return;

          if (quantity <= 0) {
            // Remove item
            await tx.execute(`DELETE FROM ${SALE_ITEMS_TABLE} WHERE id = ?`, [
              existingItem.id,
            ]);
          } else {
            // Update quantity using UPDATE (not DELETE+INSERT)
            const newSubtotal = quantity * existingItem.unit_price;

            await tx.execute(
              `UPDATE ${SALE_ITEMS_TABLE} SET quantity = ?, subtotal = ? WHERE id = ?`,
              [quantity, newSubtotal, existingItem.id]
            );
          }

          // Recalculate and update total within the same transaction
          const result = await tx.get<{ total: number }>(
            `SELECT COALESCE(SUM(subtotal), 0) as total FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ?`,
            [currentSaleId]
          );
          const newTotal = result?.total ?? 0;

          await tx.execute(
            `UPDATE ${SALES_TABLE} SET total_amount = ? WHERE id = ?`,
            [newTotal, currentSaleId]
          );
        });
      } catch (err) {
        console.error("Error updating quantity:", err);
      }
    },
    [currentSaleId]
  );

  /**
   * Remove item from cart - persists to local database
   * Uses a transaction to ensure item removal and total recalculation are atomic
   */
  const removeItem = useCallback(
    async (productId: string) => {
      if (!currentSaleId) return;

      try {
        await powerSync.writeTransaction(async (tx) => {
          // Get item to remove
          const existingItem = await tx
            .get<{ id: string }>(
              `SELECT id FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ? AND product_id = ?`,
              [currentSaleId, productId]
            )
            .catch(() => null);

          if (!existingItem) return;

          await tx.execute(`DELETE FROM ${SALE_ITEMS_TABLE} WHERE id = ?`, [
            existingItem.id,
          ]);

          // Recalculate and update total within the same transaction
          const result = await tx.get<{ total: number }>(
            `SELECT COALESCE(SUM(subtotal), 0) as total FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ?`,
            [currentSaleId]
          );
          const newTotal = result?.total ?? 0;

          await tx.execute(
            `UPDATE ${SALES_TABLE} SET total_amount = ? WHERE id = ?`,
            [newTotal, currentSaleId]
          );
        });
      } catch (err) {
        console.error("Error removing item:", err);
      }
    },
    [currentSaleId]
  );

  /**
   * Clear all items from cart - deletes draft sale
   */
  const clearCart = useCallback(async () => {
    if (!currentSaleId) return;

    try {
      await powerSync.writeTransaction(async (tx) => {
        // Delete all items
        await tx.execute(`DELETE FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ?`, [
          currentSaleId,
        ]);
        // Delete the draft sale
        await tx.execute(`DELETE FROM ${SALES_TABLE} WHERE id = ?`, [
          currentSaleId,
        ]);
      });
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  }, [currentSaleId]);

  /**
   * Complete the sale - update status from draft to completed
   * After completion, the client will have no draft sale until next addItem
   */
  const completeSale = useCallback(async (): Promise<string | null> => {
    if (!cashier || !currentSaleId || items.length === 0) {
      return null;
    }

    setIsProcessing(true);

    try {
      const now = new Date().toISOString();

      // Update the sale status to completed
      await powerSync.execute(
        `UPDATE ${SALES_TABLE} 
         SET status = 'completed', total_amount = ?, completed_at = ? 
         WHERE id = ?`,
        [total, now, currentSaleId]
      );

      const completedSaleId = currentSaleId;
      setIsProcessing(false);

      return completedSaleId;
    } catch (err) {
      console.error("Error completing sale:", err);
      setIsProcessing(false);
      return null;
    }
  }, [cashier, currentSaleId, items.length, total]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        saleId: currentSaleId,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        completeSale,
        isProcessing,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
