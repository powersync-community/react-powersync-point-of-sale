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

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  saleId: string | null;
  addItem: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  completeSale: () => Promise<string | null>;
  isProcessing: boolean;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

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

export function CartProvider({ children }: CartProviderProps) {
  const { cashier } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const draftSale = draftSales.length > 0 ? draftSales[0] : null;
  const currentSaleId = draftSale?.id ?? null;

  const { data: rawSaleItems = [], isLoading: itemsLoading } = useLiveQuery(
    (q) =>
      q
        .from({ si: saleItemsCollection })
        .where(({ si }) => eq(si.sale_id, currentSaleId ?? ""))
        .orderBy(({ si }) => si.created_at, "asc"),
    [currentSaleId]
  );

  const { data: products = [] } = useLiveQuery((q) =>
    q.from({ p: productsCollection })
  );

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

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

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  );

  const getOrCreateDraftSale = useCallback(async (): Promise<string> => {
    if (!cashier) {
      throw new Error("No cashier logged in");
    }

    if (currentSaleId) {
      return currentSaleId;
    }

    const existingDraft = await powerSync
      .get<{ id: string }>(
        `SELECT id FROM ${SALES_TABLE} WHERE cashier_id = ? AND status = 'draft' LIMIT 1`,
        [cashier.id]
      )
      .catch(() => null);

    if (existingDraft) {
      return existingDraft.id;
    }

    const newSaleId = generateId();
    const now = new Date().toISOString();

    await powerSync.execute(
      `INSERT INTO ${SALES_TABLE} (id, cashier_id, total_amount, status, created_at) 
       VALUES (?, ?, ?, 'draft', ?)`,
      [newSaleId, cashier.id, 0, now]
    );

    return newSaleId;
  }, [cashier, currentSaleId]);

  const addItem = useCallback(
    async (product: Product) => {
      if (!cashier) return;

      try {
        const saleId = await getOrCreateDraftSale();

        await powerSync.writeTransaction(async (tx) => {
          const existingItem = await tx
            .get<{ id: string; quantity: number; unit_price: number }>(
              `SELECT id, quantity, unit_price FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ? AND product_id = ?`,
              [saleId, product.id]
            )
            .catch(() => null);

          if (existingItem) {
            const newQuantity = existingItem.quantity + 1;
            const newSubtotal = newQuantity * existingItem.unit_price;

            await tx.execute(
              `UPDATE ${SALE_ITEMS_TABLE} SET quantity = ?, subtotal = ? WHERE id = ?`,
              [newQuantity, newSubtotal, existingItem.id]
            );
          } else {
            const itemId = generateId();
            const now = new Date().toISOString();

            await tx.execute(
              `INSERT INTO ${SALE_ITEMS_TABLE} (id, sale_id, product_id, quantity, unit_price, subtotal, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [itemId, saleId, product.id, 1, product.price, product.price, now]
            );
          }

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

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!currentSaleId) return;

      try {
        await powerSync.writeTransaction(async (tx) => {
          const existingItem = await tx
            .get<{ id: string; unit_price: number }>(
              `SELECT id, unit_price FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ? AND product_id = ?`,
              [currentSaleId, productId]
            )
            .catch(() => null);

          if (!existingItem) return;

          if (quantity <= 0) {
            await tx.execute(`DELETE FROM ${SALE_ITEMS_TABLE} WHERE id = ?`, [
              existingItem.id,
            ]);
          } else {
            const newSubtotal = quantity * existingItem.unit_price;

            await tx.execute(
              `UPDATE ${SALE_ITEMS_TABLE} SET quantity = ?, subtotal = ? WHERE id = ?`,
              [quantity, newSubtotal, existingItem.id]
            );
          }

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

  const removeItem = useCallback(
    async (productId: string) => {
      if (!currentSaleId) return;

      try {
        await powerSync.writeTransaction(async (tx) => {
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

  const clearCart = useCallback(async () => {
    if (!currentSaleId) return;

    try {
      await powerSync.writeTransaction(async (tx) => {
        await tx.execute(`DELETE FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ?`, [
          currentSaleId,
        ]);
        await tx.execute(`DELETE FROM ${SALES_TABLE} WHERE id = ?`, [
          currentSaleId,
        ]);
      });
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  }, [currentSaleId]);

  const completeSale = useCallback(async (): Promise<string | null> => {
    if (!cashier || !currentSaleId || items.length === 0) {
      return null;
    }

    setIsProcessing(true);

    try {
      const now = new Date().toISOString();

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
