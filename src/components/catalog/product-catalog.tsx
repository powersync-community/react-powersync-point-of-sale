import { useState } from "react";
import { Menu } from "lucide-react";
import { CategorySidebar } from "./category-sidebar";
import { ProductGrid } from "./product-grid";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsTablet, useIsDesktop } from "@/hooks/use-media-query";

/**
 * Product Catalog component
 * Main catalog view with category navigation and product grid
 * Responsive: collapsible sidebar on mobile/tablet, full sidebar on desktop
 */
export function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  // Show sidebar inline on tablet and desktop
  const showInlineSidebar = isTablet || isDesktop;

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    // Close sheet on mobile after selection
    if (!showInlineSidebar) {
      setIsCategoryOpen(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Category Sidebar - Tablet & Desktop */}
      {showInlineSidebar && (
        <div className="w-56 shrink-0 hidden md:block">
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 overflow-hidden min-w-0">
        <ProductGrid
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCategories={() => setIsCategoryOpen(true)}
          showCategoryButton={!showInlineSidebar}
        />
      </div>

      {/* Mobile Category Sheet */}
      <Sheet open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Categories</SheetTitle>
          <SheetDescription className="sr-only">
            Select a category to filter products
          </SheetDescription>
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

