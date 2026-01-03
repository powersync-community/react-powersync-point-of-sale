import { Minus, Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/contexts/cart-context";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

/**
 * Cart Item component
 * Displays individual cart item with quantity controls
 */
export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-3 p-3 bg-background rounded-lg border border-border group">
      {/* Product Image */}
      <div className="h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
        {item.product.image_url ? (
          <img
            src={item.product.image_url}
            alt={item.product.name ?? ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">
          {item.product.name ?? "Unnamed"}
        </h4>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(item.unitPrice)} each
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium w-8 text-center tabular-nums">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.product.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="text-right shrink-0">
        <p className="pos-price text-sm text-primary">
          {formatCurrency(item.subtotal)}
        </p>
      </div>
    </div>
  );
}

