import { useQuery } from "@powersync/react";
import { LayoutGrid, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CATEGORIES_TABLE, type CategoryRecord } from "@/powersync/AppSchema";
import { cn } from "@/lib/utils";

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
  const { data: categories, isLoading } = useQuery<CategoryRecord>(
    `SELECT * FROM ${CATEGORIES_TABLE} ORDER BY sort_order ASC`,
    []
  );

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
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
    </div>
  );
}

