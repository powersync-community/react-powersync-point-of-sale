import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { powerSync } from "@/powersync/System";
import {
  SALES_TABLE,
  SALE_ITEMS_TABLE,
} from "@/powersync/AppSchema";
import { generateId } from "@/lib/utils";
import type { Product } from "@/collections/products";
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
 * Manages shopping cart state and persists sales to PowerSync
 */
export function CartProvider({ children }: CartProviderProps) {
  const { cashier } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [saleId, setSaleId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
   * Add product to cart or increment quantity
   */
  const addItem = useCallback((product: Product) => {
    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingIndex >= 0) {
        // Increment existing item
        const updated = [...current];
        const existing = updated[existingIndex];
        const newQuantity = existing.quantity + 1;
        updated[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          subtotal: newQuantity * existing.unitPrice,
        };
        return updated;
      }

      // Add new item
      return [
        ...current,
        {
          id: generateId(),
          product,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      ];
    });
  }, []);

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) =>
        current.filter((item) => item.product.id !== productId)
      );
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
            }
          : item
      )
    );
  }, []);

  /**
   * Remove item from cart
   */
  const removeItem = useCallback((productId: string) => {
    setItems((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }, []);

  /**
   * Clear all items from cart
   */
  const clearCart = useCallback(() => {
    setItems([]);
    setSaleId(null);
  }, []);

  /**
   * Complete the sale - persist to database
   */
  const completeSale = useCallback(async (): Promise<string | null> => {
    if (!cashier || items.length === 0) {
      return null;
    }

    setIsProcessing(true);

    try {
      const newSaleId = saleId || generateId();
      const now = new Date().toISOString();

      // Use a transaction to ensure atomic write
      await powerSync.writeTransaction(async (tx) => {
        // Create or update the sale record
        await tx.execute(
          `INSERT OR REPLACE INTO ${SALES_TABLE} (id, cashier_id, total_amount, status, created_at, completed_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [newSaleId, cashier.id, total, "completed", now, now]
        );

        // Insert all sale items
        for (const item of items) {
          await tx.execute(
            `INSERT INTO ${SALE_ITEMS_TABLE} (id, sale_id, product_id, quantity, unit_price, subtotal, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId(),
              newSaleId,
              item.product.id,
              item.quantity,
              item.unitPrice,
              item.subtotal,
              now,
            ]
          );
        }
      });

      // Clear cart after successful sale
      setItems([]);
      setSaleId(null);
      setIsProcessing(false);

      return newSaleId;
    } catch (err) {
      console.error("Error completing sale:", err);
      setIsProcessing(false);
      return null;
    }
  }, [cashier, items, saleId, total]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        saleId,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        completeSale,
        isProcessing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

