import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProductCatalog } from "@/components/catalog/product-catalog";
import { CartSidebar } from "@/components/cart/cart-sidebar";

/**
 * Main POS route component
 * Shows product catalog and cart
 */
function POSPage() {
  const navigate = useNavigate();
  const { cashier } = useAuth();

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
    <div className="h-full flex">
      {/* Product Catalog - Main Area */}
      <div className="flex-1 overflow-hidden">
        <ProductCatalog />
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 border-l border-border">
        <CartSidebar />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: POSPage,
});

