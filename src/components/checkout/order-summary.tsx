import { Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/contexts/cart-context";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
}

export function OrderSummary({ items, total }: OrderSummaryProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Order Summary</h3>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
          >
            <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
              {item.product.image_url ? (
                <img
                  src={item.product.image_url}
                  alt={item.product.name ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {item.product.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(item.unitPrice)} × {item.quantity}
              </p>
            </div>

            <p className="pos-price text-sm font-semibold">
              {formatCurrency(item.subtotal)}
            </p>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (0%)</span>
          <span className="tabular-nums">{formatCurrency(0)}</span>
        </div>
        <Separator />
        <div className="flex justify-between pt-2">
          <span className="text-xl font-bold">Total</span>
          <span className="pos-price text-3xl text-primary font-bold">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
