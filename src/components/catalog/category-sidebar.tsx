import { useLiveQuery } from "@tanstack/react-db";
import { LayoutGrid, Package, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { categoriesCollection, productsCollection } from "@/collections";
import { eq } from "@tanstack/db";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface CategorySidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

/**
 * Category Sidebar component
 * Displays list of product categories for filtering
 */
export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
}: CategorySidebarProps) {
  const { cashier, logout } = useAuth();

  // Fetch categories using TanStack DB liveQuery
  const { data: categories = [], isLoading } = useLiveQuery((q) =>
    q.from({ c: categoriesCollection }).orderBy(({ c }) => c.sort_order, "asc")
  );

  // Fetch total product count
  const { data: products = [] } = useLiveQuery((q) =>
    q.from({ p: productsCollection }).where(({ p }) => eq(p.is_active, true))
  );

  const productCount = products.length;

  return (
    <div className="h-full flex flex-col border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Categories
        </h2>
      </div>

      {/* Category List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Products */}
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-12",
              selectedCategory === null && "bg-primary/10 border border-primary/30"
            )}
            onClick={() => onSelectCategory(null)}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center",
                selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </div>
            <span className="font-medium">All Products</span>
          </Button>

          {/* Category Buttons */}
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-muted/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  selectedCategory === category.id &&
                    "bg-primary/10 border border-primary/30"
                )}
                onClick={() => onSelectCategory(category.id)}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden",
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name ?? ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                </div>
                <span className="font-medium truncate">
                  {category.name ?? "Unnamed"}
                </span>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer - Fixed at bottom */}
      <div className="shrink-0 border-t border-border">
        {/* Product Count */}
        <div className="p-2 text-center text-xs text-muted-foreground border-b border-border">
          {productCount} product{productCount !== 1 && "s"} available
        </div>

        {/* Cashier Info */}
        <div className="p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{cashier?.name ?? "Guest"}</p>
                <p className="text-xs text-muted-foreground">Cashier</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

