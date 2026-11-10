"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageInput = exports.accessInput = exports.approvalInput = exports.saveFormulationInput = exports.formulationInput = exports.costProfileInput = exports.costsInput = exports.rateInput = exports.ingredientUpdate = exports.ingredientInput = exports.dateOnly = exports.objectId = exports.code = exports.price = exports.quantity = void 0;
const zod_1 = require("zod");
const feed_types_1 = require("../types/feed.types");
const decimalString = (places, max) => zod_1.z
    .string()
    .regex(new RegExp(`^(0|[1-9]\\d{0,8})(\\.\\d{1,${places}})?$`), `Use a non-negative decimal string with up to ${places} decimal places`)
    .refine((value) => Number(value) <= max, `Must be at most ${max}`);
exports.quantity = decimalString(6, 100000);
exports.price = decimalString(4, 10000000);
exports.code = zod_1.z.string().regex(/^[A-Z][A-Z0-9_]{0,39}$/);
exports.objectId = zod_1.z.string().regex(/^[a-f\d]{24}$/i);
exports.dateOnly = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value);
}, "Use a real Gregorian date: YYYY-MM-DD");
const note = zod_1.z.string().trim().min(1).max(500);
exports.ingredientInput = zod_1.z
    .object({
    code: exports.code,
    name: zod_1.z.string().trim().min(1).max(100),
    category: zod_1.z.enum(["RAW_MATERIAL", "ADDITIVE"]),
    inputUnit: zod_1.z.enum(["kg", "g"]),
})
    .strict();
exports.ingredientUpdate = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1).max(100).optional(),
    active: zod_1.z.boolean().optional(),
})
    .strict()
    .refine((value) => Object.keys(value).length > 0, "Supply a name or active flag");
exports.rateInput = zod_1.z
    .object({
    requestId: zod_1.z.string().uuid(),
    baseVersion: zod_1.z.number().int().nonnegative(),
    effectiveDate: exports.dateOnly,
    mode: zod_1.z.enum(["PATCH", "REPLACE"]),
    note,
    entries: zod_1.z
        .array(zod_1.z
        .object({
        ingredientCode: exports.code,
        pricePerKg: exports.price,
    })
        .strict())
        .min(1)
        .max(500),
})
    .strict();
exports.costsInput = zod_1.z
    .object({
    bagCount: zod_1.z.number().int().min(0).max(10000),
    bagPrice: exports.price,
    goodsLossPercent: decimalString(4, 100),
    overheadPerReference: exports.price,
    productionPerReference: exports.price,
    transportPerReference: exports.price,
    otherPerReference: exports.price,
    sellingPricePerTonne: exports.price,
    commissionPerTonne: exports.price,
})
    .strict();
exports.costProfileInput = zod_1.z
    .object({
    requestId: zod_1.z.string().uuid(),
    baseVersion: zod_1.z.number().int().nonnegative(),
    costs: exports.costsInput,
    note,
})
    .strict();
exports.formulationInput = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(1).max(120),
    group: zod_1.z.enum(["giriraj", "shraddha", "sirjan", "layers"]),
    formulationDate: exports.dateOnly,
    rateVersion: zod_1.z.number().int().positive(),
    referenceKg: exports.quantity.refine((value) => Number(value) > 0),
    batchKg: exports.quantity.refine((value) => Number(value) > 0),
    batchMode: zod_1.z.enum(["NOMINAL", "EXACT"]),
    costBasis: zod_1.z.enum(["NOMINAL_REFERENCE", "ACTUAL_WEIGHT"]),
    notes: zod_1.z.string().trim().max(2000).default(""),
    columns: zod_1.z
        .array(zod_1.z
        .object({
        productCode: zod_1.z.string().max(5),
        costs: exports.costsInput,
        lines: zod_1.z
            .array(zod_1.z
            .object({
            ingredientCode: exports.code,
            quantity: exports.quantity,
        })
            .strict())
            .min(1)
            .max(500),
    })
        .strict())
        .min(1)
        .max(3),
})
    .strict()
    .superRefine((value, ctx) => {
    const products = feed_types_1.PRODUCTS[value.group];
    const seen = new Set();
    value.columns.forEach((column, index) => {
        if (!products.includes(column.productCode) ||
            seen.has(column.productCode)) {
            ctx.addIssue({
                code: "custom",
                message: "Unknown or duplicate product for this group",
                path: ["columns", index, "productCode"],
            });
        }
        seen.add(column.productCode);
        const ingredients = new Set();
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
exports.saveFormulationInput = zod_1.z
    .object({
    requestId: zod_1.z.string().uuid(),
    formulation: exports.formulationInput,
})
    .strict();
exports.approvalInput = zod_1.z
    .object({
    acknowledgedWarnings: zod_1.z.array(zod_1.z.string().max(150)).max(1500),
    note,
})
    .strict();
exports.accessInput = zod_1.z
    .object({
    email: zod_1.z.string().email().max(254),
    role: zod_1.z.enum(["EMPLOYEE", "DIRECTOR"]),
    active: zod_1.z.boolean(),
    note,
})
    .strict();
exports.pageInput = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).max(100000).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
});
