import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { ProductCatalog } from "@/components/catalog/product-catalog";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import { formatCurrency } from "@/lib/utils";

/**
 * Main POS route component
 * Shows product catalog and cart with responsive layout
 */
function POSPage() {
  const navigate = useNavigate();
  const { cashier } = useAuth();
  const { itemCount, total } = useCart();
  const isDesktop = useIsDesktop();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!cashier) {
      navigate({ to: "/login" });
    }
  }, [cashier, navigate]);

  if (!cashier) {
    return null;
  }

  return (
    <div className="h-full flex relative">
      {/* Product Catalog - Main Area */}
      <div className="flex-1 overflow-hidden min-w-0">
        <ProductCatalog />
      </div>

      {/* Cart Sidebar - Desktop Only */}
      {isDesktop && (
        <div className="w-96 border-l border-border shrink-0">
          <CartSidebar />
        </div>
      )}

      {/* Mobile/Tablet Cart Button */}
      {!isDesktop && (
        <Button
          size="lg"
          className="fixed bottom-4 right-4 h-14 px-6 shadow-lg z-40 gap-2"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 ? (
            <>
              <span className="font-semibold">{itemCount}</span>
              <span className="text-primary-foreground/80">•</span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </>
          ) : (
            <span>Cart</span>
          )}
        </Button>
      )}

      {/* Mobile/Tablet Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
          <SheetDescription className="sr-only">
            View and manage items in your shopping cart
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

