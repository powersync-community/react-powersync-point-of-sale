import { useQuery } from "@powersync/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  SALES_TABLE,
  SALE_ITEMS_TABLE,
  CASHIERS_TABLE,
} from "@/powersync/AppSchema";
import { formatCurrency } from "@/lib/utils";

interface ActiveSaleRow {
  id: string;
  total_amount: number | null;
  cashier_name: string | null;
  item_count: number | null;
}

const ACTIVE_SALES_QUERY = `
  SELECT
    s.id              AS id,
    s.total_amount    AS total_amount,
    c.name            AS cashier_name,
    COALESCE(
      (SELECT SUM(si.quantity) FROM ${SALE_ITEMS_TABLE} si WHERE si.sale_id = s.id),
      0
    )                 AS item_count
  FROM ${SALES_TABLE} s
  LEFT JOIN ${CASHIERS_TABLE} c ON c.id = s.cashier_id
  WHERE s.status = 'draft'
  ORDER BY s.created_at DESC
`;

export function ActiveSales() {
  const { data: activeSales = [], isLoading: salesLoading } =
    useQuery<ActiveSaleRow>(ACTIVE_SALES_QUERY);

  const totalActiveSales = activeSales.length;
  const totalPendingValue = activeSales.reduce(
    (sum, s) => sum + (s.total_amount ?? 0),
    0
  );

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 pt-8 pb-6 flex items-end justify-between flex-wrap gap-6">
        <div className="flex items-end gap-4">
          <Link
            to="/"
            className="h-10 w-10 -mb-1 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                live activity
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              {totalActiveSales}{" "}
              <span className="text-muted-foreground font-normal">
                active {totalActiveSales === 1 ? "sale" : "sales"}
              </span>
            </h1>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            pending value
          </span>
          <p className="text-4xl font-bold text-primary tabular-nums leading-tight mt-1">
            {formatCurrency(totalPendingValue)}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-8 pb-8">
        {salesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-muted/20 border border-border animate-pulse"
              />
            ))}
          </div>
        ) : activeSales.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="text-6xl font-bold tracking-tight text-muted-foreground/20 mb-3">
                00
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                waiting for sales
              </p>
              <p className="text-sm text-muted-foreground/60 mt-3 leading-relaxed">
                Booth orders appear here the moment they start.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSales.map((sale, idx) => (
              <article
                key={sale.id}
                className="group relative bg-card border border-border rounded-md hover:border-primary/40 transition-colors p-5 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/60 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums">
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/40 tabular-nums">
                    {sale.id.slice(0, 8)}
                  </span>
                </div>

                <h3 className="text-2xl font-bold tracking-tight truncate mb-4">
                  {sale.cashier_name ?? "anonymous"}
                </h3>

                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {sale.item_count ?? 0}{" "}
                    {sale.item_count === 1 ? "item" : "items"}
                  </span>
                  <span className="text-2xl font-bold text-primary tabular-nums">
                    {formatCurrency(sale.total_amount ?? 0)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
