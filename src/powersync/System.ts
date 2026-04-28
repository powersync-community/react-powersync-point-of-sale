import {
  createBaseLogger,
  LogLevel,
  PowerSyncDatabase,
  SyncClientImplementation,
  WASQLiteOpenFactory,
  WASQLiteVFS,
} from "@powersync/web";
import { AppSchema } from "./AppSchema";
import { connector } from "./SupabaseConnector";

const logger = createBaseLogger();
logger.useDefaults();
logger.setLevel(LogLevel.DEBUG);

const enableMultiTabs = typeof SharedWorker !== "undefined";

/**
 * OPFS-backed SQLite VFS. Persists in the browser's Origin Private File
 * System (the only durable, performant option for PowerSync on the web)
 * and supports multi-tab access via SharedWorker.
 *
 * Requires the page to load in a cross-origin isolated context, which
 * means COOP=`same-origin` and COEP=`credentialless` response headers
 * (set by vite.config.ts in dev and Caddyfile in production). Without
 * those headers PowerSync falls back to the IndexedDB VFS.
 *
 * The PowerSyncDatabase constructor accepts this factory via its
 * `database` field; the simpler `database: { dbFilename: ... }` form
 * doesn't expose `vfs` at the type level, so the factory is the only
 * way to opt out of the default IDB VFS.
 */
const opfsFactory = new WASQLiteOpenFactory({
  dbFilename: "pos.db",
  vfs: WASQLiteVFS.OPFSCoopSyncVFS,
  flags: { enableMultiTabs },
});

export const powerSync = new PowerSyncDatabase({
  database: opfsFactory,
  schema: AppSchema,
  flags: { enableMultiTabs },
  logger,
});

async function initializePowerSync() {
  try {
    await connector.signInAnonymously();
    powerSync.connect(connector, {
      clientImplementation: SyncClientImplementation.RUST,
      crudUploadThrottleMs: 5000,
    });
    console.log("PowerSync connected successfully");
  } catch (error) {
    console.warn(
      "PowerSync connection failed, running in offline mode:",
      error
    );
  }
}

initializePowerSync();
