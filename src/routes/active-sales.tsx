import { createFileRoute } from "@tanstack/react-router";
import { ActiveSales } from "@/components/sales/active-sales";

function ActiveSalesPage() {
  return <ActiveSales />;
}

export const Route = createFileRoute("/active-sales")({
  component: ActiveSalesPage,
});
