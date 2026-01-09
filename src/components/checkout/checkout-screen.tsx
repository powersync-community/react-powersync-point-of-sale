import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Printer,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderSummary } from "./order-summary";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";

export function CheckoutScreen() {
  const navigate = useNavigate();
  const { cashier } = useAuth();
  const { items, total, completeSale, isProcessing } = useCart();
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);

  const handleMarkAsPaid = async () => {
    const saleId = await completeSale();
    if (saleId) {
      setCompletedSaleId(saleId);
      setCompletedAt(new Date());
    }
  };

  const handleNewSale = () => {
    setCompletedSaleId(null);
    setCompletedAt(null);
    navigate({ to: "/" });
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (items.length === 0 && !completedSaleId) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Cart is Empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some products to your cart before checking out.
            </p>
            <Button onClick={() => navigate({ to: "/" })}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Catalog
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completedSaleId) {
    return (
      <div className="h-full flex items-center justify-center p-8 print:p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8">
            <div className="text-center mb-6">
              <div className="h-20 w-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4 animate-pulse-success">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-success">
                Payment Complete!
              </h2>
              <p className="text-muted-foreground mt-1">
                Transaction processed successfully
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-3 print:bg-white print:border">
              <div className="text-center border-b border-border pb-3">
                <h3 className="font-bold text-lg">PowerSync POS Demo</h3>
                <p className="text-xs text-muted-foreground">
                  Sale Receipt
                </p>
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sale ID:</span>
                  <span className="font-mono text-xs">
                    {completedSaleId.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cashier:</span>
                  <span>{cashier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{completedAt ? formatDate(completedAt) : "-"}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-border pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Paid</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 print:hidden">
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePrintReceipt}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleNewSale}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Start New Sale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>

          <Card>
            <CardContent className="pt-6">
              <OrderSummary items={items} total={total} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="w-96 border-l border-border p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Payment</h2>

        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-2">Amount Due</p>
            <p className="pos-price text-5xl font-bold text-primary">
              {formatCurrency(total)}
            </p>
          </div>

          <Button
            size="xl"
            className="w-full h-16 text-xl font-bold gradient-primary"
            onClick={handleMarkAsPaid}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-6 w-6" />
                Mark as Paid
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Click to complete the transaction
          </p>
        </div>

        <div className="mt-auto pt-6 border-t border-border text-sm text-muted-foreground">
          <p>Cashier: {cashier?.name}</p>
        </div>
      </div>
    </div>
  );
}
