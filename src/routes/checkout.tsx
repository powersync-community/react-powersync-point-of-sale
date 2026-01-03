import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { CheckoutScreen } from "@/components/checkout/checkout-screen";

/**
 * Checkout route component
 * Shows order summary and payment completion
 */
function CheckoutPage() {
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

  return <CheckoutScreen />;
}

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

