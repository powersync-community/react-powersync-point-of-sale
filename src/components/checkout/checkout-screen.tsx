import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Printer,
  ShoppingBag,
} from "lucide-react";
import { OrderSummary } from "./order-summary";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export function CheckoutScreen() {
  const navigate = useNavigate();
  const { cashier } = useAuth();
  const { items, total, completeSale, isProcessing } = useCart();
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [completedTotal, setCompletedTotal] = useState<number | null>(null);
  const [completedItems, setCompletedItems] = useState<typeof items>([]);

  const handleMarkAsPaid = async () => {
    const finalTotal = total;
    const finalItems = items;
    const saleId = await completeSale();
    if (saleId) {
      setCompletedSaleId(saleId);
      setCompletedAt(new Date());
      setCompletedTotal(finalTotal);
      setCompletedItems(finalItems);
    }
  };

  const handleNewSale = () => {
    setCompletedSaleId(null);
    setCompletedAt(null);
    setCompletedTotal(null);
    setCompletedItems([]);
    navigate({ to: "/" });
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (items.length === 0 && !completedSaleId) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl font-bold tracking-tight text-muted-foreground/15 mb-3">
            00
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            nothing to check out
          </p>
          <p className="text-sm text-muted-foreground/60 mt-3 leading-relaxed mb-8">
            Add items from the catalog to start an order.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            back to catalog
          </button>
        </div>
      </div>
    );
  }

  if (completedSaleId) {
    return (
      <div className="h-full overflow-auto print:overflow-visible">
        <div className="min-h-full flex items-center justify-center px-6 py-12 print:p-0">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6 print:hidden">
              <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-success">
                · paid ·
              </span>
            </div>

            <div className="bg-card border border-border p-6 font-mono text-sm print:bg-white print:text-black print:border-0 print:shadow-none">
              <div className="text-center pb-4 mb-4 border-b border-dashed border-border print:border-black/40">
                <div className="text-base font-bold tracking-[0.3em] uppercase">
                  PowerSync
                </div>
                <div className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground mt-1 print:text-black/60">
                  point of sale
                </div>
              </div>

              <div className="space-y-1 text-xs mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground print:text-black/70">
                    sale
                  </span>
                  <span className="tabular-nums">
                    #{completedSaleId.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground print:text-black/70">
                    cashier
                  </span>
                  <span className="truncate ml-2 max-w-[10rem]">
                    {cashier?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground print:text-black/70">
                    date
                  </span>
                  <span>{completedAt ? formatDate(completedAt) : "-"}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-border print:border-black/40 pt-3 space-y-1.5">
                {completedItems.map((item) => (
                  <div key={item.id} className="text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="truncate">{item.product.name}</span>
                      <span className="tabular-nums shrink-0">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums print:text-black/60">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-border print:border-black/40 mt-4 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-[0.2em]">
                    total paid
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-primary print:text-black">
                    {formatCurrency(completedTotal ?? 0)}
                  </span>
                </div>
              </div>

              <div className="text-center text-[10px] text-muted-foreground/60 mt-6 tracking-wider print:text-black/60">
                — thanks for visiting the booth —
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 print:hidden">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="h-12 border border-border text-sm font-semibold tracking-tight hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" />
                print
              </button>
              <button
                type="button"
                onClick={handleNewSale}
                className="h-12 bg-primary text-primary-foreground text-sm font-semibold tracking-tight hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                new sale
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className="flex-1 overflow-auto pb-32 md:pb-0">
        <div className="max-w-2xl mx-auto px-6 pt-6 md:px-10 md:pt-10">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-3 w-3" />
            back to catalog
          </button>

          <div className="pb-10">
            <OrderSummary items={items} total={total} />
          </div>
        </div>
      </div>

      <aside
        className={cn(
          "md:w-[26rem] md:border-l md:border-border md:flex md:flex-col",
          "fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background",
          "md:static md:bottom-auto md:inset-auto md:border-t-0"
        )}
      >
        <div className="px-6 py-4 md:p-10 md:flex-1 md:flex md:flex-col md:justify-center">
          <div className="hidden md:block mb-6">
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
              amount due
            </span>
          </div>
          <div className="flex items-baseline justify-between md:block md:mb-10">
            <span className="md:hidden text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
              total
            </span>
            <p className="text-3xl md:text-7xl font-bold text-primary tabular-nums leading-none md:tracking-tight">
              {formatCurrency(total)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAsPaid}
            disabled={isProcessing}
            className={cn(
              "hidden md:flex w-full h-16 bg-success text-success-foreground items-center justify-between px-5 group",
              "hover:bg-success/90 hover:shadow-lg hover:shadow-success/20 transition-all",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none",
              "text-lg font-semibold tracking-tight mt-6"
            )}
          >
            <span>
              {isProcessing ? "processing…" : "mark as paid"}
            </span>
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            )}
          </button>

          <p className="hidden md:block text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-4">
            tap to complete the transaction
          </p>
        </div>

        <button
          type="button"
          onClick={handleMarkAsPaid}
          disabled={isProcessing}
          className={cn(
            "md:hidden w-full h-16 bg-success text-success-foreground flex items-center justify-between px-5",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "text-base font-semibold tracking-tight"
          )}
        >
          <span>{isProcessing ? "processing…" : "mark as paid"}</span>
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowRight className="h-5 w-5" />
          )}
        </button>

        <div className="hidden md:block px-10 pb-8 text-xs text-muted-foreground">
          <span className="text-[10px] uppercase tracking-[0.3em] mr-2">
            cashier
          </span>
          <span className="font-semibold text-foreground tracking-tight">
            {cashier?.name}
          </span>
        </div>
      </aside>
    </div>
  );
}
