import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { powerSync } from "@/powersync/System";
import { AppSchema } from "@/powersync/AppSchema";

/**
 * Zod schema for Cashier records
 * Transforms SQLite types to rich JavaScript types
 */
export const cashierSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  pin_hash: z.string().nullable(),
  is_active: z
    .number()
    .nullable()
    .transform((val) => (val != null ? val > 0 : false)),
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

/** Cashier type derived from Zod schema */
export type Cashier = z.infer<typeof cashierSchema>;

/**
 * Cashiers collection with TanStack DB
 * Provides reactive access to cashier data for PIN authentication
 */
export const cashiersCollection = createCollection(
  powerSyncCollectionOptions({
    database: powerSync,
    table: AppSchema.props.cashiers,
    schema: cashierSchema,
    onDeserializationError: (error) => {
      console.error("Cashier deserialization error:", error);
    },
  })
);
