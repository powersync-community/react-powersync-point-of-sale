import { useLiveQuery } from "@tanstack/react-db";
import { eq, like, or } from "@tanstack/db";
import { Search, PackageX, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "./product-card";
import { CategoryRail } from "./category-rail";
import { productsCollection } from "@/collections";
import { useCart } from "@/contexts/cart-context";

interface ProductGridProps {
  selectedCategory: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectCategory: (categoryId: string | null) => void;
  showRail: boolean;
}

export function ProductGrid({
  selectedCategory,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  showRail,
}: ProductGridProps) {
  const { addItem } = useCart();

  const { data: products = [], isLoading } = useLiveQuery(
    (q) => {
      let query = q
        .from({ p: productsCollection })
        .where(({ p }) => eq(p.is_active, true));

      if (selectedCategory) {
        query = query.where(({ p }) => eq(p.category_id, selectedCategory));
      }

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
      <div className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <input
            placeholder="Search products or SKU…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-border focus:border-primary text-base h-11 pl-7 pr-8 placeholder:text-muted-foreground/40 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showRail && (
        <CategoryRail
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-md overflow-hidden">
                  <div className="aspect-square bg-muted/40 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-muted/40 animate-pulse w-3/4" />
                    <div className="h-3 bg-muted/40 animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PackageX className="h-10 w-10 mb-4 text-muted-foreground/40" />
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                no matches
              </p>
              <p className="text-sm text-muted-foreground/60 mt-2 max-w-xs">
                {searchQuery
                  ? "Try a different search term."
                  : "Nothing in this category yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
    </div>
  );
}
