import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useStatus } from "@powersync/react";
import { Wifi, WifiOff, Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Root route component
 * Provides layout wrapper and connectivity status bar
 */
function RootComponent() {
  const status = useStatus();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Connectivity Status Bar */}
      <div className="h-8 bg-card border-b border-border flex items-center justify-between px-4 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground font-medium">
            RetailPOS
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sync Status */}
          <div className="flex items-center gap-1.5">
            {status?.dataFlowStatus?.downloading ? (
              <Cloud className="h-3.5 w-3.5 text-primary animate-pulse" />
            ) : status?.dataFlowStatus?.uploading ? (
              <Cloud className="h-3.5 w-3.5 text-accent animate-pulse" />
            ) : status?.connected ? (
              <Cloud className="h-3.5 w-3.5 text-success" />
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">
              {status?.dataFlowStatus?.downloading
                ? "Syncing..."
                : status?.dataFlowStatus?.uploading
                  ? "Uploading..."
                  : status?.connected
                    ? "Synced"
                    : "Offline"}
            </span>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-1.5">
            {status?.connected ? (
              <Wifi className="h-3.5 w-3.5 text-success" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
            )}
            <span
              className={cn(
                status?.connected ? "text-success" : "text-destructive"
              )}
            >
              {status?.connected ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});

