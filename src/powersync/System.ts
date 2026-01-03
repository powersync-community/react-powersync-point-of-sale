import {
  createBaseLogger,
  LogLevel,
  PowerSyncDatabase,
  SyncClientImplementation,
  WASQLiteOpenFactory,
  WASQLiteVFS
} from "@powersync/web";
import { AppSchema } from "./AppSchema";
import { connector } from "./SupabaseConnector";

const logger = createBaseLogger();
logger.useDefaults();
logger.setLevel(LogLevel.DEBUG);

/**
 * PowerSync Database instance
 * Uses OPFS storage for multi-tab support and Safari compatibility
 */
export const powerSync = new PowerSyncDatabase({
  database: new WASQLiteOpenFactory({
    dbFilename: "pos.db",
    vfs: WASQLiteVFS.OPFSCoopSyncVFS,
    flags: {
      enableMultiTabs: typeof SharedWorker !== "undefined",
    },
  }),
  flags: {
    enableMultiTabs: typeof SharedWorker !== "undefined",
  },
  schema: AppSchema,
  logger: logger,
});

/**
 * Initialize PowerSync connection
 * Attempts anonymous sign-in, but doesn't block app loading if it fails
 */
export async function initializePowerSync() {
  try {
    // Try to sign in anonymously to Supabase
    await connector.signInAnonymously();
    
    // Connect PowerSync with Supabase
    powerSync.connect(connector, { 
      clientImplementation: SyncClientImplementation.RUST, 
      crudUploadThrottleMs: 5000 
    });
    
    console.log("PowerSync connected successfully");
  } catch (error) {
    console.warn("PowerSync connection failed, running in offline mode:", error);
  }
}

// Initialize on module load (non-blocking)
initializePowerSync();
