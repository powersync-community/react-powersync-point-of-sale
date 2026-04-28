import { z } from "zod";

/**
 * Robust nullable-number coercion for synced columns.
 *
 * PowerSync may deliver numeric values as plain numbers, numeric strings
 * (DECIMAL columns sometimes round-trip as strings to preserve precision),
 * or bigints. Anything non-finite (NaN, Infinity) becomes null so the
 * downstream `?? 0` substitutes a safe default.
 *
 * The cast at the bottom is deliberate: at runtime this is a `z.preprocess`
 * pipeline that accepts `unknown`, but at compile time we present it as a
 * plain `z.ZodNullable<z.ZodNumber>` so consumers (and TanStack DB's table
 * column inference) see strict `number | null` inputs. Without the cast the
 * `unknown` input widens object input shapes and `useLiveQuery` element
 * types lose their precise field types.
 */
const _coerceNumber = z.preprocess(
  (val) => {
    if (val === null || val === undefined) return val;
    if (typeof val === "number") return Number.isFinite(val) ? val : null;
    if (typeof val === "bigint") return Number(val);
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return null;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : null;
    }
    return val;
  },
  z.number().nullable()
);

export const coerceNumber = _coerceNumber as unknown as z.ZodNullable<
  z.ZodNumber
>;
