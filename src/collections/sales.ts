import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { powerSync } from "@/powersync/System";
import { AppSchema } from "@/powersync/AppSchema";

/** Sale status enum values */
export const SALE_STATUS = {
  DRAFT: "draft",
  COMPLETED: "completed",
  VOIDED: "voided",
} as const;

export type SaleStatus = (typeof SALE_STATUS)[keyof typeof SALE_STATUS];

/**
 * Zod schema for Sale records
 * Transforms SQLite types to rich JavaScript types
 */
export const saleSchema = z.object({
  id: z.string(),
  cashier_id: z.string().nullable(),
  total_amount: z.number().nullable().transform((val) => val ?? 0),
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

/** Sale type derived from Zod schema */
export type Sale = z.infer<typeof saleSchema>;

/**
 * Sales collection with TanStack DB
 * Provides reactive access to sales transactions
 */
export const salesCollection = createCollection(
  powerSyncCollectionOptions({
    database: powerSync,
    table: AppSchema.props.sales,
    schema: saleSchema,
    onDeserializationError: (error) => {
      console.error("Sale deserialization error:", error);
    },
  })
);

