import { useState, useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { eq } from "@tanstack/db";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  ShoppingCart,
  User,
  Package,
  Activity,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  salesCollection,
  saleItemsCollection,
  productsCollection,
  cashiersCollection,
  SALE_STATUS,
} from "@/collections";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Extended sale item with product info */
interface SaleItemWithProduct {
  id: string;
  sale_id: string | null | undefined;
  product_id: string | null | undefined;
  quantity: number | null | undefined;
  unit_price: number | null | undefined;
  subtotal: number | null | undefined;
  product_name: string | null;
  product_image: string | null;
}

/** Sale with cashier info */
interface SaleWithCashier {
  id: string;
  cashier_id: string | null;
  total_amount: number;
  status: string;
  created_at: Date | null;
  cashier_name: string | null;
}

/**
 * Active Sales component
 * Displays real-time view of in-progress sales across all connected clients
 */
export function ActiveSales() {
  const [selectedSale, setSelectedSale] = useState<string | null>(null);

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

  // Merge sales with cashier info
  const activeSales = useMemo<SaleWithCashier[]>(() => {
    const cashierMap = new Map(cashiers.map((c) => [c.id, c]));
    return rawActiveSales.map((sale) => {
      const cashier = sale.cashier_id ? cashierMap.get(sale.cashier_id) : null;
      return {
        id: sale.id,
        cashier_id: sale.cashier_id,
        total_amount: sale.total_amount ?? 0,
        status: sale.status ?? SALE_STATUS.DRAFT,
        created_at: sale.created_at,
        cashier_name: cashier?.name ?? null,
      };
    });
  }, [rawActiveSales, cashiers]);

  // Fetch items for selected sale
  const { data: rawSaleItems = [] } = useLiveQuery(
    (q) =>
      q
        .from({ si: saleItemsCollection })
        .where(({ si }) => eq(si.sale_id, selectedSale)),
    [selectedSale]
  );

  // Fetch all products for lookup
  const { data: products = [] } = useLiveQuery((q) =>
    q.from({ p: productsCollection })
  );

  // Merge sale items with product info
  const saleItems = useMemo<SaleItemWithProduct[]>(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    return rawSaleItems.map((item) => {
      const product = item.product_id ? productMap.get(item.product_id) : null;
      return {
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        product_name: product?.name ?? null,
        product_image: product?.image_url ?? null,
      };
    });
  }, [rawSaleItems, products]);

  // Get selected sale details
  const selectedSaleData = useMemo(
    () => activeSales.find((s) => s.id === selectedSale),
    [activeSales, selectedSale]
  );

  // Calculate stats
  const totalActiveSales = activeSales.length;
  const totalPendingValue = activeSales.reduce(
    (sum, s) => sum + (s.total_amount ?? 0),
    0
  );

  // Get time since sale started
  const getTimeSince = (date: Date | null) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return formatDate(date);
  };

  return (
    <div className="h-full flex">
      {/* Active Sales List */}
      <div className="w-[400px] border-r border-border flex flex-col">
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
          <div className="grid grid-cols-2 gap-3">
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

        {/* Active Sales List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {salesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-muted/30 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : activeSales.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No active sales</p>
                <p className="text-sm">Sales in progress will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeSales.map((sale) => (
                  <button
                    key={sale.id}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedSale === sale.id
                        ? "bg-accent/10 border-2 border-accent/40 shadow-lg shadow-accent/10"
                        : "bg-card hover:bg-card/80 border border-border hover:border-accent/30"
                    }`}
                    onClick={() => setSelectedSale(sale.id ?? null)}
                  >
                    {/* Sale Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{sale.id.slice(0, 8)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-accent/20 text-accent border-accent/30"
                      >
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        In Progress
                      </Badge>
                    </div>

                    {/* Cashier Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm font-medium">
                        {sale.cashier_name ?? "Unknown Cashier"}
                      </span>
                    </div>

                    {/* Sale Amount & Time */}
                    <div className="flex items-center justify-between">
                      <span className="pos-price text-lg font-bold text-primary">
                        {formatCurrency(sale.total_amount)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getTimeSince(sale.created_at)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

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

      {/* Sale Details */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedSale && selectedSaleData ? (
          <Card className="max-w-2xl mx-auto border-accent/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Sale in Progress
                    <RefreshCw className="h-4 w-4 text-accent animate-spin" />
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">
                    #{selectedSale.slice(0, 8)}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-accent/20 text-accent border-accent/30"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-muted-foreground mb-1">Cashier</p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <p className="font-medium">
                      {selectedSaleData.cashier_name ?? "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-muted-foreground mb-1">Started</p>
                  <p className="font-medium">
                    {selectedSaleData.created_at
                      ? formatDate(selectedSaleData.created_at)
                      : "-"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Cart Items
                  <Badge variant="outline" className="text-xs">
                    {saleItems.length} item{saleItems.length !== 1 && "s"}
                  </Badge>
                </h4>
                {saleItems.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground bg-muted/20 rounded-lg">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {saleItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="h-10 w-10 rounded overflow-hidden bg-muted">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {item.product_name ?? "Unknown Product"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unit_price ?? 0)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(item.subtotal ?? 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center bg-accent/10 p-4 rounded-lg border border-accent/20">
                <span className="text-lg font-semibold">Current Total</span>
                <span className="pos-price text-2xl font-bold text-primary">
                  {formatCurrency(selectedSaleData.total_amount ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Select an active sale to view details</p>
              <p className="text-sm mt-1">
                Updates appear in real-time as cashiers modify carts
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

