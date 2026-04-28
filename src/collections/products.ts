import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { powerSync } from "@/powersync/System";
import { AppSchema } from "@/powersync/AppSchema";
import { coerceNumber } from "./_helpers";

export const productSchema = z.object({
  id: z.string(),
  category_id: z.string().nullable(),
  name: z.string().nullable(),
  sku: z.string().nullable(),
  price: coerceNumber.transform((val) => val ?? 0),
  image_url: z.string().nullable(),
  stock_quantity: coerceNumber.transform((val) => val ?? 0),
  is_active: coerceNumber.transform((val) => (val != null ? val > 0 : false)),
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

export type Product = z.infer<typeof productSchema>;

export const productsCollection = createCollection(
  powerSyncCollectionOptions({
    database: powerSync,
    table: AppSchema.props.products,
    schema: productSchema,
    onDeserializationError: (error: unknown) => {
      console.error("Product deserialization error:", error);
    },
  })
);
