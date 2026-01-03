import { useMemo } from "react";
import { useQuery } from "@powersync/react";
import { Search, PackageX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "./product-card";
import { PRODUCTS_TABLE, type ProductRecord } from "@/powersync/AppSchema";
import type { Product } from "@/collections/products";
import { useCart } from "@/contexts/cart-context";

interface ProductGridProps {
  selectedCategory: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Product Grid component
 * Displays filterable grid of products
 */
export function ProductGrid({
  selectedCategory,
  searchQuery,
  onSearchChange,
}: ProductGridProps) {
  const { addItem } = useCart();

  // Build query based on filters
  const query = useMemo(() => {
    let sql = `SELECT * FROM ${PRODUCTS_TABLE} WHERE is_active = 1`;
    const params: (string | number)[] = [];

    if (selectedCategory) {
      sql += ` AND category_id = ?`;
      params.push(selectedCategory);
    }

    if (searchQuery.trim()) {
      sql += ` AND (name LIKE ? OR sku LIKE ?)`;
      const searchTerm = `%${searchQuery.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ` ORDER BY name ASC`;

    return { sql, params };
  }, [selectedCategory, searchQuery]);

  const { data: products, isLoading } = useQuery<ProductRecord>(
    query.sql,
    query.params
  );

  // Transform to Product type
  const transformedProducts: Product[] = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        category_id: p.category_id,
        name: p.name,
        sku: p.sku,
        price: p.price ?? 0,
        image_url: p.image_url,
        stock_quantity: p.stock_quantity ?? 0,
        is_active: (p.is_active ?? 0) > 0,
        created_at: p.created_at ? new Date(p.created_at) : null,
      })),
    [products]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11"
          />
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
          ) : transformedProducts.length === 0 ? (
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
              {transformedProducts.map((product) => (
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
        {transformedProducts.length} product
        {transformedProducts.length !== 1 && "s"} found
      </div>
    </div>
  );
}

