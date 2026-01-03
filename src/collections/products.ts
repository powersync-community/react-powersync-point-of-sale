import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { powerSync } from "@/powersync/System";
import { AppSchema } from "@/powersync/AppSchema";

/**
 * Zod schema for Product records
 * Transforms SQLite types to rich JavaScript types
 */
export const productSchema = z.object({
  id: z.string(),
  category_id: z.string().nullable(),
  name: z.string().nullable(),
  sku: z.string().nullable(),
  price: z.number().nullable().transform((val) => val ?? 0),
  image_url: z.string().nullable(),
  stock_quantity: z.number().nullable().transform((val) => val ?? 0),
  is_active: z
    .number()
    .nullable()
    .transform((val) => (val != null ? val > 0 : false)),
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

/** Product type derived from Zod schema */
export type Product = z.infer<typeof productSchema>;

/**
 * Products collection with TanStack DB
 * Provides reactive access to product catalog with pricing and inventory
 */
export const productsCollection = createCollection(
  powerSyncCollectionOptions({
    database: powerSync,
    table: AppSchema.props.products,
    schema: productSchema,
    onDeserializationError: (error) => {
      console.error("Product deserialization error:", error);
    },
  })
);

