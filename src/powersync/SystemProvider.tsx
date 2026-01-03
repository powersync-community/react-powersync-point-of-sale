import { PowerSyncContext } from "@powersync/react";
import React from "react";
import { powerSync } from "./System";
import { SupabaseContext } from "./SystemContext";
import { connector } from "./SupabaseConnector";

/**
 * System Provider component
 * Provides PowerSync and Supabase contexts to the app
 */
export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PowerSyncContext.Provider value={powerSync}>
      <SupabaseContext.Provider value={connector}>
        {children}
      </SupabaseContext.Provider>
    </PowerSyncContext.Provider>
  );
};

export default SystemProvider;
