import { Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  Trash2,
  Receipt,
  History,
  LogOut,
  User,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "./cart-item";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency } from "@/lib/utils";

interface CartSidebarProps {
  onClose?: () => void;
}

export function CartSidebar({ onClose }: CartSidebarProps) {
  const { cashier, logout } = useAuth();
  const { items, itemCount, total, updateQuantity, removeItem, clearCart } =
    useCart();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Current Sale</h2>
            {itemCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={clearCart}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Cart is empty</p>
              <p className="text-sm">Add products to start a sale</p>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {items.length > 0 && (
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (0%)</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(0)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold text-lg">Total</span>
            <span className="pos-price text-2xl text-primary">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border space-y-2">
        <Link to="/checkout" className="block" onClick={onClose}>
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            disabled={items.length === 0}
          >
            <Receipt className="mr-2 h-5 w-5" />
            Checkout
          </Button>
        </Link>

        <Link to="/sales" className="block" onClick={onClose}>
          <Button variant="outline" size="lg" className="w-full">
            <History className="mr-2 h-4 w-4" />
            Sales History
          </Button>
        </Link>

        <Link to="/active-sales" className="block" onClick={onClose}>
          <Button variant="outline" size="lg" className="w-full">
            <Activity className="mr-2 h-4 w-4" />
            Active Sales
          </Button>
        </Link>
      </div>

      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{cashier?.name ?? "Guest"}</p>
              <p className="text-xs text-muted-foreground">Cashier</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
