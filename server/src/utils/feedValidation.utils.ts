import { z } from "zod";
import { PRODUCTS } from "../types/feed.types";

const decimalString = (places: number, max: number) =>
  z
    .string()
    .regex(
      new RegExp(`^(0|[1-9]\\d{0,8})(\\.\\d{1,${places}})?$`),
      `Use a non-negative decimal string with up to ${places} decimal places`,
    )
    .refine((value) => Number(value) <= max, `Must be at most ${max}`);

export const quantity = decimalString(6, 100_000);
export const price = decimalString(4, 10_000_000);

export const code = z.string().regex(/^[A-Z][A-Z0-9_]{0,39}$/);
export const objectId = z.string().regex(/^[a-f\d]{24}$/i);

export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);

    return (
      !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
    );
  }, "Use a real Gregorian date: YYYY-MM-DD");

const note = z.string().trim().min(1).max(500);

export const ingredientInput = z
  .object({
    code,
    name: z.string().trim().min(1).max(100),
    category: z.enum(["RAW_MATERIAL", "ADDITIVE"]),
    inputUnit: z.enum(["kg", "g"]),
  })
  .strict();

export const ingredientUpdate = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Supply a name or active flag",
  );

export const rateInput = z
  .object({
    requestId: z.string().uuid(),
    baseVersion: z.number().int().nonnegative(),
    effectiveDate: dateOnly,
    mode: z.enum(["PATCH", "REPLACE"]),
    note,
    entries: z
      .array(
        z
          .object({
            ingredientCode: code,
            pricePerKg: price,
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict();

export const costsInput = z
  .object({
    bagCount: z.number().int().min(0).max(10_000),
    bagPrice: price,
    goodsLossPercent: decimalString(4, 100),

    overheadPerReference: price,
    productionPerReference: price,
    transportPerReference: price,
    otherPerReference: price,

    sellingPricePerTonne: price,
    commissionPerTonne: price,
  })
  .strict();

export const costProfileInput = z
  .object({
    requestId: z.string().uuid(),
    baseVersion: z.number().int().nonnegative(),
    costs: costsInput,
    note,
  })
  .strict();

export const formulationInput = z
  .object({
    title: z.string().trim().min(1).max(120),
    group: z.enum(["giriraj", "shraddha", "sirjan", "layers"]),
    formulationDate: dateOnly,
    rateVersion: z.number().int().positive(),

    referenceKg: quantity.refine((value) => Number(value) > 0),
    batchKg: quantity.refine((value) => Number(value) > 0),

    batchMode: z.enum(["NOMINAL", "EXACT"]),
    costBasis: z.enum(["NOMINAL_REFERENCE", "ACTUAL_WEIGHT"]),

    notes: z.string().trim().max(2000).default(""),

    columns: z
      .array(
        z
          .object({
            productCode: z.string().max(5),
            costs: costsInput,
            lines: z
              .array(
                z
                  .object({
                    ingredientCode: code,
                    quantity,
                  })
                  .strict(),
              )
              .min(1)
              .max(500),
          })
          .strict(),
      )
      .min(1)
      .max(3),
  })
  .strict()
  .superRefine((value, ctx) => {
    const products: readonly string[] = PRODUCTS[value.group];

    const seen = new Set<string>();

    value.columns.forEach((column, index) => {
      if (
        !products.includes(column.productCode) ||
        seen.has(column.productCode)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Unknown or duplicate product for this group",
          path: ["columns", index, "productCode"],
        });
      }

      seen.add(column.productCode);

      const ingredients = new Set<string>();

      column.lines.forEach((line, row) => {
        if (ingredients.has(line.ingredientCode)) {
          ctx.addIssue({
            code: "custom",
            message: "Duplicate ingredient",
            path: ["columns", index, "lines", row],
          });
        }

        ingredients.add(line.ingredientCode);
      });
    });
  });

export const saveFormulationInput = z
  .object({
    requestId: z.string().uuid(),
    formulation: formulationInput,
  })
  .strict();

export const approvalInput = z
  .object({
    acknowledgedWarnings: z.array(z.string().max(150)).max(1500),
    note,
  })
  .strict();

export const accessInput = z
  .object({
    email: z.string().email().max(254),
    role: z.enum(["EMPLOYEE", "DIRECTOR"]),
    active: z.boolean(),
    note,
  })
  .strict();

export const pageInput = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type FormulationInput = z.infer<typeof formulationInput>;
export type RateInput = z.infer<typeof rateInput>;
