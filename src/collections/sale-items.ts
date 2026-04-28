import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { powerSync } from "@/powersync/System";
import { AppSchema } from "@/powersync/AppSchema";
import { coerceNumber } from "./_helpers";

export const saleItemSchema = z.object({
  id: z.string(),
  sale_id: z.string().nullable(),
  product_id: z.string().nullable(),
  quantity: coerceNumber.transform((val) => val ?? 0),
  unit_price: coerceNumber.transform((val) => val ?? 0),
  subtotal: coerceNumber.transform((val) => val ?? 0),
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

export type SaleItem = z.infer<typeof saleItemSchema>;

export const saleItemsCollection = createCollection(
  powerSyncCollectionOptions({
    database: powerSync,
    table: AppSchema.props.sale_items,
    schema: saleItemSchema,
    onDeserializationError: (error: unknown) => {
      console.error("Sale item deserialization error:", error);
    },
  })
);
