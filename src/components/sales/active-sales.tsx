import { useEffect, useState } from "react";
import { useQuery } from "@powersync/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { powerSync } from "@/powersync/System";
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
  created_at: string | null;
}

const ACTIVE_SALES_QUERY = `
  SELECT
    s.id              AS id,
    s.total_amount    AS total_amount,
    s.created_at      AS created_at,
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

function formatRelative(iso: string | null, nowMs: number): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Math.max(0, nowMs - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

async function deleteSale(saleId: string) {
  try {
    await powerSync.writeTransaction(async (tx) => {
      await tx.execute(
        `DELETE FROM ${SALE_ITEMS_TABLE} WHERE sale_id = ?`,
        [saleId]
      );
      await tx.execute(`DELETE FROM ${SALES_TABLE} WHERE id = ?`, [saleId]);
    });
  } catch (err) {
    console.error("Failed to delete sale:", err);
  }
}

export function ActiveSales() {
  const { data: activeSales = [], isLoading: salesLoading } =
    useQuery<ActiveSaleRow>(ACTIVE_SALES_QUERY);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const totalActiveSales = activeSales.length;
  const totalPendingValue = activeSales.reduce(
    (sum, s) => sum + (s.total_amount ?? 0),
    0
  );

  const handleDelete = (sale: ActiveSaleRow) => {
    const label = sale.cashier_name ?? "this draft";
    const ok = window.confirm(
      `Delete the active draft for "${label}"? This removes the order and its items everywhere.`
    );
    if (ok) {
      void deleteSale(sale.id);
    }
  };

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
              <img
                src="/icons/powersync-logo.png"
                alt=""
                className="mx-auto h-20 w-20 object-contain mb-6 opacity-60 animate-spin [animation-duration:8s]"
              />
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
                  <button
                    type="button"
                    onClick={() => handleDelete(sale)}
                    aria-label={`Delete draft for ${sale.cashier_name ?? "anonymous"}`}
                    title="Delete this draft"
                    className="h-7 w-7 -mr-1 -mt-1 flex items-center justify-center text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3 className="text-2xl font-bold tracking-tight truncate mb-1">
                  {sale.cashier_name ?? "anonymous"}
                </h3>

                <div
                  className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60 tabular-nums uppercase tracking-wider mb-4"
                  title={sale.created_at ?? undefined}
                >
                  <span>{formatTime(sale.created_at)}</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span>{formatRelative(sale.created_at, now)}</span>
                </div>

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
