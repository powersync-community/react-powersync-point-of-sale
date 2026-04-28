import { Link } from "@tanstack/react-router";
import { Trash2, ArrowRight, History, Activity, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartItem } from "./cart-item";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { cn, formatCurrency } from "@/lib/utils";

interface CartSidebarProps {
  onClose?: () => void;
}

export function CartSidebar({ onClose }: CartSidebarProps) {
  const { cashier, logout } = useAuth();
  const { items, itemCount, total, updateQuantity, removeItem, clearCart } =
    useCart();
  const hasItems = items.length > 0;

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="px-5 pt-6 pb-4 flex items-end justify-between">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            order
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">
            {itemCount}{" "}
            <span className="text-muted-foreground font-normal text-base">
              {itemCount === 1 ? "item" : "items"}
            </span>
          </h2>
        </div>
        {hasItems && (
          <button
            type="button"
            onClick={clearCart}
            className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="h-3 w-3" />
            clear
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="px-5 pb-2">
          {!hasItems ? (
            <div className="py-16 text-center">
              <div className="text-5xl font-bold tracking-tight text-muted-foreground/15 mb-3">
                00
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                empty
              </p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                Tap a product to start an order.
              </p>
            </div>
          ) : (
            <div className="-mx-5 divide-y divide-border/60">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {hasItems && (
        <div className="px-5 py-4 border-t border-border space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tax</span>
            <span className="tabular-nums">{formatCurrency(0)}</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
              total
            </span>
            <span className="text-3xl font-bold text-primary tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      )}

      <div className="px-5 pb-3">
        <Link to="/checkout" className="block" onClick={onClose}>
          <button
            type="button"
            disabled={!hasItems}
            className={cn(
              "w-full h-14 rounded-md bg-primary text-primary-foreground transition-all flex items-center justify-between px-5 group",
              "hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-primary",
              "text-base font-semibold tracking-tight"
            )}
          >
            <span>Checkout</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-disabled:translate-x-0" />
          </button>
        </Link>
      </div>

      <div className="px-5 pb-4 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        <Link
          to="/active-sales"
          onClick={onClose}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <Activity className="h-3 w-3" />
          live
        </Link>
        <span className="text-border">·</span>
        <Link
          to="/sales"
          onClick={onClose}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <History className="h-3 w-3" />
          history
        </Link>
      </div>

      <div className="px-5 py-4 border-t border-border flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            signed in as
          </p>
          <p className="text-sm font-semibold tracking-tight mt-0.5 truncate max-w-[12rem]">
            {cashier?.name ?? "Guest"}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out"
          className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
