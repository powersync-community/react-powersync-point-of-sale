import { useState } from "react";
import { CategorySidebar } from "./category-sidebar";
import { ProductGrid } from "./product-grid";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsTablet, useIsDesktop } from "@/hooks/use-media-query";

export function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  const showInlineSidebar = isTablet || isDesktop;

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (!showInlineSidebar) {
      setIsCategoryOpen(false);
    }
  };

  return (
    <div className="h-full flex">
      {showInlineSidebar && (
        <div className="w-56 shrink-0 hidden md:block">
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        </div>
      )}

      <div className="flex-1 overflow-hidden min-w-0">
        <ProductGrid
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCategories={() => setIsCategoryOpen(true)}
          showCategoryButton={!showInlineSidebar}
        />
      </div>

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
