import { useLiveQuery } from "@tanstack/react-db";
import { eq, like, or } from "@tanstack/db";
import { Search, PackageX, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "./product-card";
import { productsCollection } from "@/collections";
import { useCart } from "@/contexts/cart-context";

interface ProductGridProps {
  selectedCategory: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** Callback to open categories sheet on mobile */
  onOpenCategories?: () => void;
  /** Whether to show the category button (mobile only) */
  showCategoryButton?: boolean;
}

/**
 * Product Grid component
 * Displays filterable grid of products
 */
export function ProductGrid({
  selectedCategory,
  searchQuery,
  onSearchChange,
  onOpenCategories,
  showCategoryButton = false,
}: ProductGridProps) {
  const { addItem } = useCart();

  // Fetch products using TanStack DB liveQuery with filters
  const { data: products = [], isLoading } = useLiveQuery(
    (q) => {
      // Start with base query for active products
      let query = q
        .from({ p: productsCollection })
        .where(({ p }) => eq(p.is_active, true));

      // Apply category filter if selected
      if (selectedCategory) {
        query = query.where(({ p }) => eq(p.category_id, selectedCategory));
      }

      // Apply search filter if provided
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.where(({ p }) =>
          or(like(p.name, searchTerm), like(p.sku, searchTerm))
        );
      }

      return query.orderBy(({ p }) => p.name, "asc");
    },
    [selectedCategory, searchQuery]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          {/* Category Button - Mobile Only */}
          {showCategoryButton && (
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={onOpenCategories}
              aria-label="Open categories"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="pos-card animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-5 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <PackageX className="h-16 w-16 mb-4" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-sm">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "No products in this category"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addItem}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Product Count */}
      <div className="p-2 border-t border-border text-center text-xs text-muted-foreground">
        {products.length} product
        {products.length !== 1 && "s"} found
      </div>
    </div>
  );
}

