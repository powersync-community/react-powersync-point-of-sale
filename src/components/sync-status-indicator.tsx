import { useStatus } from "@powersync/react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusIndicatorProps {
  className?: string;
}

export function SyncStatusIndicator({ className }: SyncStatusIndicatorProps) {
  const status = useStatus();
  const downloading = !!status?.dataFlowStatus?.downloading;
  const uploading = !!status?.dataFlowStatus?.uploading;

  return (
    <span className={cn("flex items-center", className)}>
      <ArrowDown
        className={cn(
          "h-3.5 w-3.5 transition-opacity",
          downloading
            ? "text-primary animate-pulse"
            : "text-muted-foreground/40"
        )}
      />
      <ArrowUp
        className={cn(
          "h-3.5 w-3.5 -ml-1 transition-opacity",
          uploading ? "text-accent animate-pulse" : "text-muted-foreground/40"
        )}
      />
    </span>
  );
}
