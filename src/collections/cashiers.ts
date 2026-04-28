import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { powerSync } from "@/powersync/System";
import { AppSchema } from "@/powersync/AppSchema";
import { coerceNumber } from "./_helpers";

export const cashierSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  pin_hash: z.string().nullable(),
  is_active: coerceNumber.transform((val) => (val != null ? val > 0 : false)),
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

export type Cashier = z.infer<typeof cashierSchema>;

export const cashiersCollection = createCollection(
  powerSyncCollectionOptions({
    database: powerSync,
    table: AppSchema.props.cashiers,
    schema: cashierSchema,
    onDeserializationError: (error: unknown) => {
      console.error("Cashier deserialization error:", error);
    },
  })
);
