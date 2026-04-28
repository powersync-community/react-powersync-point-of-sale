import { useLiveQuery } from "@tanstack/react-db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { categoriesCollection } from "@/collections";
import { cn } from "@/lib/utils";

interface CategorySidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

interface CategoryOption {
  id: string | null;
  name: string;
}

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
}: CategorySidebarProps) {
  const { data: categories = [], isLoading } = useLiveQuery((q) =>
    q.from({ c: categoriesCollection }).orderBy(({ c }) => c.sort_order, "asc")
  );

  const options: CategoryOption[] = [
    { id: null, name: "All products" },
    ...categories.map((c) => ({ id: c.id, name: c.name ?? "Unnamed" })),
  ];

  return (
    <div className="h-full flex flex-col border-r border-border">
      <div className="px-5 pt-6 pb-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          categories
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="pb-4">
          {isLoading ? (
            <div className="px-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-5 bg-muted/40 animate-pulse"
                  style={{ width: `${50 + (i * 7) % 30}%` }}
                />
              ))}
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = selectedCategory === opt.id;
              return (
                <button
                  key={opt.id ?? "__all"}
                  type="button"
                  onClick={() => onSelectCategory(opt.id)}
                  className={cn(
                    "w-full flex items-center gap-3 text-left px-5 py-3 transition-colors group",
                    isSelected
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "block w-px h-5 transition-all",
                      isSelected
                        ? "bg-primary w-[2px]"
                        : "bg-border/50 group-hover:bg-border"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm tracking-tight truncate",
                      isSelected ? "font-semibold" : "font-medium"
                    )}
                  >
                    {opt.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
