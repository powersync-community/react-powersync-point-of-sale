import { useState, useMemo } from "react";
import { useQuery } from "@powersync/react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  SALES_TABLE,
  SALE_ITEMS_TABLE,
  PRODUCTS_TABLE,
  type SaleRecord,
  type SaleItemRecord,
} from "@/powersync/AppSchema";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Extended sale item with product info */
interface SaleItemWithProduct extends SaleItemRecord {
  product_name: string | null;
  product_image: string | null;
}

/**
 * Sales History component
 * Displays list of completed sales with details
 */
export function SalesHistory() {
  const [selectedSale, setSelectedSale] = useState<string | null>(null);

  // Fetch all sales
  const { data: sales, isLoading: salesLoading } = useQuery<SaleRecord>(
    `SELECT * FROM ${SALES_TABLE} ORDER BY created_at DESC`,
    []
  );

  // Fetch items for selected sale
  const { data: saleItems } = useQuery<SaleItemWithProduct>(
    `SELECT si.*, p.name as product_name, p.image_url as product_image 
     FROM ${SALE_ITEMS_TABLE} si 
     LEFT JOIN ${PRODUCTS_TABLE} p ON si.product_id = p.id 
     WHERE si.sale_id = ?`,
    [selectedSale ?? ""],
    { runQueryOnce: !selectedSale }
  );

  // Get selected sale details
  const selectedSaleData = useMemo(
    () => sales.find((s) => s.id === selectedSale),
    [sales, selectedSale]
  );

  /** Get status badge config */
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return {
          variant: "success" as const,
          icon: CheckCircle2,
          label: "Completed",
        };
      case "voided":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          label: "Voided",
        };
      default:
        return { variant: "secondary" as const, icon: Clock, label: "Draft" };
    }
  };

  // Calculate totals
  const totalSales = sales.filter((s) => s.status === "completed").length;
  const totalRevenue = sales
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + (s.total_amount ?? 0), 0);

  return (
    <div className="h-full flex">
      {/* Sales List */}
      <div className="w-[400px] border-r border-border flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Sales History</h1>
              <p className="text-xs text-muted-foreground">
                View completed transactions
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Sales</p>
              <p className="text-xl font-bold">{totalSales}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Sales List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {salesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted/30 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : sales.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No sales yet</p>
                <p className="text-sm">Complete a sale to see it here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sales.map((sale) => {
                  const status = getStatusBadge(sale.status);
                  const StatusIcon = status.icon;

                  return (
                    <button
                      key={sale.id}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedSale === sale.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedSale(sale.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{sale.id.slice(0, 8)}
                        </span>
                        <Badge variant={status.variant} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="pos-price font-bold">
                          {formatCurrency(sale.total_amount ?? 0)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {sale.created_at ? formatDate(sale.created_at) : "-"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Sale Details */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedSale && selectedSaleData ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Sale Details</CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">
                    #{selectedSale.slice(0, 8)}
                  </p>
                </div>
                <Badge variant={getStatusBadge(selectedSaleData.status).variant}>
                  {getStatusBadge(selectedSaleData.status).label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {selectedSaleData.created_at
                      ? formatDate(selectedSaleData.created_at)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completed At</p>
                  <p className="font-medium">
                    {selectedSaleData.completed_at
                      ? formatDate(selectedSaleData.completed_at)
                      : "-"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3">Items</h4>
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
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="pos-price text-2xl font-bold text-primary">
                  {formatCurrency(selectedSaleData.total_amount ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Receipt className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Select a sale to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

