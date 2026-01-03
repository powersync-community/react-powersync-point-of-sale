import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { powerSync } from "@/powersync/System";
import { AppSchema } from "@/powersync/AppSchema";

/**
 * Zod schema for Category records
 * Transforms SQLite types to rich JavaScript types
 */
export const categorySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  sort_order: z.number().nullable(),
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

/** Category type derived from Zod schema */
export type Category = z.infer<typeof categorySchema>;

/**
 * Categories collection with TanStack DB
 * Provides reactive access to product categories for catalog navigation
 */
export const categoriesCollection = createCollection(
  powerSyncCollectionOptions({
    database: powerSync,
    table: AppSchema.props.categories,
    schema: categorySchema,
    onDeserializationError: (error) => {
      console.error("Category deserialization error:", error);
    },
  })
);

