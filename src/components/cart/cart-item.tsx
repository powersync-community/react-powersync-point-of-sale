import { Minus, Plus, X, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/contexts/cart-context";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 group">
      <div className="h-12 w-12 bg-muted/50 shrink-0 overflow-hidden">
        {item.product.image_url ? (
          <img
            src={item.product.image_url}
            alt={item.product.name ?? ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="font-semibold text-sm tracking-tight truncate">
            {item.product.name ?? "Unnamed"}
          </h4>
          <p className="font-bold text-sm text-primary tabular-nums shrink-0">
            {formatCurrency(item.subtotal)}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <div className="inline-flex items-center border border-border">
            <button
              type="button"
              onClick={() =>
                onUpdateQuantity(item.product.id, item.quantity - 1)
              }
              aria-label="Decrease quantity"
              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateQuantity(item.product.id, item.quantity + 1)
              }
              aria-label="Increase quantity"
              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums hidden sm:inline">
            @ {formatCurrency(item.unitPrice)}
          </span>

          <button
            type="button"
            onClick={() => onRemove(item.product.id)}
            aria-label="Remove item"
            className="ml-auto h-9 w-9 flex items-center justify-center text-muted-foreground/40 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
