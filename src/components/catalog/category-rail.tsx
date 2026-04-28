import { useLiveQuery } from "@tanstack/react-db";
import { categoriesCollection } from "@/collections";
import { cn } from "@/lib/utils";

interface CategoryRailProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryRail({
  selectedCategory,
  onSelectCategory,
}: CategoryRailProps) {
  const { data: categories = [] } = useLiveQuery((q) =>
    q.from({ c: categoriesCollection }).orderBy(({ c }) => c.sort_order, "asc")
  );

  const options = [
    { id: null as string | null, name: "All" },
    ...categories.map((c) => ({ id: c.id, name: c.name ?? "Unnamed" })),
  ];

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 px-4 py-3 min-w-max">
        {options.map((opt) => {
          const isSelected = selectedCategory === opt.id;
          return (
            <button
              key={opt.id ?? "__all"}
              type="button"
              onClick={() => onSelectCategory(opt.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium tracking-tight transition-colors whitespace-nowrap",
                "border-b-2",
                isSelected
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {opt.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
