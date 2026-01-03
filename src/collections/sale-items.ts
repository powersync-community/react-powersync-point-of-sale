import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { powerSync } from "@/powersync/System";
import { AppSchema } from "@/powersync/AppSchema";

/**
 * Zod schema for SaleItem records
 * Transforms SQLite types to rich JavaScript types
 */
export const saleItemSchema = z.object({
  id: z.string(),
  sale_id: z.string().nullable(),
  product_id: z.string().nullable(),
  quantity: z.number().nullable().transform((val) => val ?? 0),
  unit_price: z.number().nullable().transform((val) => val ?? 0),
  subtotal: z.number().nullable().transform((val) => val ?? 0),
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

/** SaleItem type derived from Zod schema */
export type SaleItem = z.infer<typeof saleItemSchema>;

/**
 * Sale Items collection with TanStack DB
 * Provides reactive access to line items within sales
 */
export const saleItemsCollection = createCollection(
  powerSyncCollectionOptions({
    database: powerSync,
    table: AppSchema.props.sale_items,
    schema: saleItemSchema,
    onDeserializationError: (error) => {
      console.error("Sale item deserialization error:", error);
    },
  })
);

