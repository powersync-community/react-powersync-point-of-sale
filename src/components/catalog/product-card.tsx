import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/collections/products";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

/**
 * Product Card component
 * Displays product info with quick add-to-cart action
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isLowStock = product.stock_quantity <= 5;
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div
      className="pos-card pos-grid-item group relative overflow-hidden"
      onClick={() => !isOutOfStock && onAddToCart(product)}
    >
      {/* Image */}
      <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name ?? ""}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Quick Add Button */}
        {!isOutOfStock && (
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}

        {/* Stock Badge */}
        {isOutOfStock ? (
          <Badge
            variant="destructive"
            className="absolute top-2 right-2"
          >
            Out of Stock
          </Badge>
        ) : isLowStock ? (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 bg-accent text-accent-foreground"
          >
            Low Stock
          </Badge>
        ) : null}
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <h3 className="font-medium text-sm line-clamp-2 leading-tight">
          {product.name ?? "Unnamed Product"}
        </h3>
        {product.sku && (
          <p className="text-xs text-muted-foreground font-mono">
            {product.sku}
          </p>
        )}
        <p className="pos-price text-lg text-primary">
          {formatCurrency(product.price)}
        </p>
      </div>

      {/* Overlay for out of stock */}
      {isOutOfStock && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center cursor-not-allowed">
          <span className="text-muted-foreground font-medium">Unavailable</span>
        </div>
      )}
    </div>
  );
}

