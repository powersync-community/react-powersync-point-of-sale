import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ActiveSales } from "@/components/sales/active-sales";

/**
 * Active sales route component
 * Shows real-time view of in-progress sales across connected clients
 */
function ActiveSalesPage() {
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

  return <ActiveSales />;
}

export const Route = createFileRoute("/active-sales")({
  component: ActiveSalesPage,
});

