import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { SalesHistory } from "@/components/sales/sales-history";

/**
 * Sales history route component
 * Shows completed sales with filtering
 */
function SalesPage() {
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

  return <SalesHistory />;
}

export const Route = createFileRoute("/sales")({
  component: SalesPage,
});

