import { Package, Plus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/collections/products";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isLowStock = product.stock_quantity <= 5;
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <button
      type="button"
      onClick={() => !isOutOfStock && onAddToCart(product)}
      disabled={isOutOfStock}
      className={cn(
        "group relative flex flex-col text-left bg-card border border-border rounded-md overflow-hidden",
        "hover:border-primary/50 active:scale-[0.98] transition-all",
        "disabled:cursor-not-allowed disabled:hover:border-border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <div className="aspect-square relative bg-muted/50 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name ?? ""}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500",
              !isOutOfStock && "group-hover:scale-110"
            )}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        {isLowStock && !isOutOfStock && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] bg-background/90 text-warning border border-warning/30">
            Low
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              sold out
            </span>
          </div>
        )}

        {!isOutOfStock && (
          <div
            className={cn(
              "absolute bottom-0 right-0 h-9 w-9 bg-primary/0 group-hover:bg-primary text-primary-foreground",
              "flex items-center justify-center transition-colors"
            )}
          >
            <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      <div className="px-3 py-3 flex items-start justify-between gap-3 min-h-[5rem]">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {product.name ?? "Unnamed"}
          </h3>
          {product.sku && (
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.15em] mt-1.5">
              {product.sku}
            </p>
          )}
        </div>
        <p className="font-bold text-base text-primary tabular-nums leading-tight shrink-0">
          {formatCurrency(product.price)}
        </p>
      </div>
    </button>
  );
}
