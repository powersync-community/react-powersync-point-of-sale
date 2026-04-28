import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { ProductCatalog } from "@/components/catalog/product-catalog";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import { formatCurrency } from "@/lib/utils";

function POSPage() {
  const navigate = useNavigate();
  const { cashier } = useAuth();
  const { itemCount, total } = useCart();
  const isDesktop = useIsDesktop();
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (!cashier) {
      navigate({ to: "/login" });
    }
  }, [cashier, navigate]);

  if (!cashier) {
    return null;
  }

  const showMobileBar = !isDesktop && itemCount > 0;

  return (
    <div className="h-full flex relative">
      <div
        className={`flex-1 overflow-hidden min-w-0 transition-[padding] ${
          showMobileBar ? "pb-16 md:pb-0" : ""
        }`}
      >
        <ProductCatalog />
      </div>

      {isDesktop && (
        <div className="w-[22rem] border-l border-border shrink-0">
          <CartSidebar />
        </div>
      )}

      {showMobileBar && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-0 inset-x-0 z-40 h-16 bg-primary text-primary-foreground flex items-center justify-between px-5 md:hidden hover:bg-primary/95 transition-colors animate-in slide-in-from-bottom"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {itemCount}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-80">
              {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tabular-nums">
              {formatCurrency(total)}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-80">
              review
            </span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </button>
      )}

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-sidebar">
          <SheetTitle className="sr-only">Current order</SheetTitle>
          <SheetDescription className="sr-only">
            Review and manage items in your current order
          </SheetDescription>
          <CartSidebar onClose={() => setIsCartOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: POSPage,
});
