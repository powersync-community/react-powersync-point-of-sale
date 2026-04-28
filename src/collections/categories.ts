import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { powerSync } from "@/powersync/System";
import { AppSchema } from "@/powersync/AppSchema";
import { coerceNumber } from "./_helpers";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  sort_order: coerceNumber,
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

export type Category = z.infer<typeof categorySchema>;

export const categoriesCollection = createCollection(
  powerSyncCollectionOptions({
    database: powerSync,
    table: AppSchema.props.categories,
    schema: categorySchema,
    onDeserializationError: (error: unknown) => {
      console.error("Category deserialization error:", error);
    },
  })
);
