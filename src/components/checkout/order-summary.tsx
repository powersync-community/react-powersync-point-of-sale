import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/contexts/cart-context";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
}

export function OrderSummary({ items, total }: OrderSummaryProps) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          your order
        </span>
        <h2 className="text-3xl font-bold tracking-tight mt-1">
          {itemCount}{" "}
          <span className="text-muted-foreground font-normal text-xl">
            {itemCount === 1 ? "item" : "items"}
          </span>
        </h2>
      </div>

      <div className="divide-y divide-border/60 border-y border-border/60">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-4">
            <div className="h-12 w-12 bg-muted/40 shrink-0 overflow-hidden">
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
              <p className="font-semibold text-sm tracking-tight truncate">
                {item.product.name}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/60 tabular-nums uppercase tracking-wider mt-0.5">
                {formatCurrency(item.unitPrice)} × {item.quantity}
              </p>
            </div>

            <p className="font-bold text-sm text-primary tabular-nums shrink-0">
              {formatCurrency(item.subtotal)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Tax</span>
          <span className="tabular-nums">{formatCurrency(0)}</span>
        </div>
      </div>
    </div>
  );
}
