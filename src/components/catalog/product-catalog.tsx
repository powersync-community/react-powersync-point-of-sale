import { useState } from "react";
import { CategorySidebar } from "./category-sidebar";
import { ProductGrid } from "./product-grid";

/**
 * Product Catalog component
 * Main catalog view with category navigation and product grid
 */
export function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="h-full flex">
      {/* Category Sidebar */}
      <div className="w-56 shrink-0">
        <CategorySidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-hidden">
        <ProductGrid
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
    </div>
  );
}

