import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useStatus } from "@powersync/react";
import { Wifi, WifiOff, Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { SyncStatusIndicator } from "@/components/sync-status-indicator";

function RootComponent() {
  const status = useStatus();
  const connected = !!status?.connected;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <div className="h-8 bg-card border-b border-border flex items-center justify-between px-4 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground font-medium">
            PowerSync POS Demo
          </span>
        </div>

        <div className="flex items-center gap-4">
          <SyncStatusIndicator />

          <div className="flex items-center gap-1.5">
            {connected ? (
              <Cloud className="h-3.5 w-3.5 text-success" />
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">
              {connected ? "Synced" : "Offline"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {connected ? (
              <Wifi className="h-3.5 w-3.5 text-success" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
            )}
            <span
              className={cn(connected ? "text-success" : "text-destructive")}
            >
              {connected ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
