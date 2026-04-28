import { useState } from "react";
import { CategorySidebar } from "./category-sidebar";
import { ProductGrid } from "./product-grid";
import { useIsTablet, useIsDesktop } from "@/hooks/use-media-query";

export function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const showInlineSidebar = isTablet || isDesktop;

  return (
    <div className="h-full flex">
      {showInlineSidebar && (
        <div className="w-52 shrink-0 hidden md:block">
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      )}

      <div className="flex-1 overflow-hidden min-w-0">
        <ProductGrid
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectCategory={setSelectedCategory}
          showRail={!showInlineSidebar}
        />
      </div>
    </div>
  );
}
