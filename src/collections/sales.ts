import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { powerSync } from "@/powersync/System";
import { AppSchema } from "@/powersync/AppSchema";
import { coerceNumber } from "./_helpers";

/** Sale status enum values */
export const SALE_STATUS = {
  DRAFT: "draft",
  COMPLETED: "completed",
  VOIDED: "voided",
} as const;

export type SaleStatus = (typeof SALE_STATUS)[keyof typeof SALE_STATUS];

/**
 * Zod schema for Sale records.
 * Numeric columns use `coerceNumber` so DECIMAL values that arrive as
 * strings or bigints during sync are coerced; the cast inside
 * `coerceNumber` keeps the inferred input shape strict.
 */
export const saleSchema = z.object({
  id: z.string(),
  cashier_id: z.string().nullable(),
  total_amount: coerceNumber.transform((val) => val ?? 0),
  status: z
    .string()
    .nullable()
    .transform((val) => (val as SaleStatus) ?? SALE_STATUS.DRAFT),
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  completed_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

export type Sale = z.infer<typeof saleSchema>;

export const salesCollection = createCollection(
  powerSyncCollectionOptions({
    database: powerSync,
    table: AppSchema.props.sales,
    schema: saleSchema,
    onDeserializationError: (error: unknown) => {
      console.error("Sale deserialization error:", error);
    },
  })
);
