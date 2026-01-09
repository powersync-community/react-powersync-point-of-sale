import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { eq } from "@tanstack/db";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShoppingCart, User, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  salesCollection,
  saleItemsCollection,
  cashiersCollection,
  SALE_STATUS,
} from "@/collections";
import { formatCurrency } from "@/lib/utils";

/**
 * Active Sales component
 * Displays real-time grid view of in-progress sales across all connected clients
 */
export function ActiveSales() {
  // Fetch only draft (active) sales using TanStack DB liveQuery - real-time updates
  const { data: rawActiveSales = [], isLoading: salesLoading } = useLiveQuery(
    (q) =>
      q
        .from({ sale: salesCollection })
        .where(({ sale }) => eq(sale.status, SALE_STATUS.DRAFT))
        .orderBy(({ sale }) => sale.created_at, "desc")
  );

  // Fetch all cashiers for lookup
  const { data: cashiers = [] } = useLiveQuery((q) =>
    q.from({ c: cashiersCollection })
  );

  // Fetch all sale items to count products per sale
  const { data: allSaleItems = [] } = useLiveQuery((q) =>
    q.from({ si: saleItemsCollection })
  );

  // Create lookup maps
  const cashierMap = useMemo(
    () => new Map(cashiers.map((c) => [c.id, c])),
    [cashiers]
  );

  // Count items per sale
  const itemCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    allSaleItems.forEach((item) => {
      if (item.sale_id) {
        const current = counts.get(item.sale_id) ?? 0;
        counts.set(item.sale_id, current + (item.quantity ?? 1));
      }
    });
    return counts;
  }, [allSaleItems]);

  // Merge sales with cashier info and item counts
  const activeSales = useMemo(() => {
    return rawActiveSales.map((sale) => {
      const cashier = sale.cashier_id ? cashierMap.get(sale.cashier_id) : null;
      return {
        id: sale.id,
        total_amount: sale.total_amount ?? 0,
        cashier_name: cashier?.name ?? "Unknown",
        item_count: itemCountMap.get(sale.id) ?? 0,
      };
    });
  }, [rawActiveSales, cashierMap, itemCountMap]);

  // Calculate stats
  const totalActiveSales = activeSales.length;
  const totalPendingValue = activeSales.reduce(
    (sum, s) => sum + s.total_amount,
    0
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              Active Sales
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time sales in progress
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Active Sales
            </p>
            <p className="text-xl font-bold text-accent">{totalActiveSales}</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              Pending Value
            </p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(totalPendingValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Sales Grid */}
      <div className="flex-1 overflow-auto p-4">
        {salesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-muted/30 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : activeSales.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No active sales</p>
              <p className="text-sm mt-1">Sales in progress will appear here</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeSales.map((sale) => (
              <Card
                key={sale.id}
                className="border-accent/20 hover:border-accent/40 transition-colors"
              >
                <CardContent className="p-4">
                  {/* Header with reference and status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{sale.id.slice(0, 8)}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-accent/20 text-accent border-accent/30 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Live
                    </Badge>
                  </div>

                  {/* Cashier */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium truncate">
                      {sale.cashier_name}
                    </span>
                  </div>

                  {/* Products count and Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {sale.item_count} {sale.item_count === 1 ? "item" : "items"}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(sale.total_amount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Real-time indicator */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span>Real-time sync enabled</span>
        </div>
      </div>
    </div>
  );
}
