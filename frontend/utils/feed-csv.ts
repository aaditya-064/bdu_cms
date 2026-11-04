import {
  PRODUCTS,
  type Brand,
  type Kind,
  type RecipeRow,
  keyOf,
} from "@/types/feed.types";

export function readRecipeCsv(text: string, brand: Brand) {
  if (text.includes("\0")) throw new Error("Export as CSV UTF-8 from Excel.");
  let source = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  let separator = ",";
  if (/^sep=[,;]\n/i.test(source)) {
    separator = source[4];
    source = source.slice(6);
  } else if (source.split("\n")[0].includes(";")) separator = ";";
  const cells: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === separator || c === "\n")) {
      row.push(cell.trim());
      cell = "";
      if (c === "\n") {
        if (row.some(Boolean)) cells.push(row);
        row = [];
      }
    } else cell += c;
  }
  if (quoted) throw new Error("Unfinished quote in CSV.");
  row.push(cell.trim());
  if (row.some(Boolean)) cells.push(row);
  // Optional first line: Sirjan,B0,B1,B2, as in the source spreadsheet.
  if (cells[0]?.[0]?.toLowerCase() === brand) cells.shift();
  const header = cells.shift() ?? [];
  while (header.length && !header[header.length - 1]) header.pop();
  if (!/^(ingredients?|ingredents)$/i.test(header[0] ?? ""))
    throw new Error("Use Ingredients,B0,B1,B2 with no Unit column.");
  if (/^unit$/i.test(header[1] ?? ""))
    throw new Error(
      "Remove the Unit column. Ingredients are kg; Additives are grams.",
    );
  const codes = header.slice(1).map((code) => code.toUpperCase());
  if (
    !codes.length ||
    codes.length > 3 ||
    new Set(codes).size !== codes.length ||
    codes.some((code) => !PRODUCTS[brand].includes(code))
  )
    throw new Error(
      `Use product columns ${PRODUCTS[brand].join(", ")} for ${brand}.`,
    );
  let kind: Kind = "ingredient";
  const rows: RecipeRow[] = [];
  const totals: { kind: Kind; values: (number | null)[] }[] = [];
  const names = new Set<string>();
  const parseNumber = (value: string, label: string) => {
    if (!value.trim()) return 0;
    // Accept normal decimals and correctly grouped quoted thousands, not hex/Infinity.
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value))
      throw new Error(`Invalid quantity for ${label}: ${value}`);
    const n = Number(value.replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0 || n > 100_000)
      throw new Error(`Invalid quantity for ${label}.`);
    return n;
  };
  for (const values of cells) {
    const name = (values[0] ?? "").trim().replace(/\s+/g, " ");
    if (
      /^(?:feed\s+)?additives$|^(?:ingredients?|ingredents)\s*\/\s*additives$/i.test(
        name,
      )
    ) {
      kind = "additive";
      continue;
    }
    if (/^total(?:\s*\([abc]\))?$/i.test(name)) {
      totals.push({
        kind,
        values: codes.map((_, i) => {
          const v = values[i + 1] ?? "";
          return v ? parseNumber(v, `${name} total`) : null;
        }),
      });
      continue;
    }
    if (!name || name.length > 100 || values.slice(header.length).some(Boolean))
      throw new Error(`Check the row for ${name || "unnamed ingredient"}.`);
    const key = keyOf(name);
    if (names.has(key)) throw new Error(`Duplicate ingredient: ${name}.`);
    names.add(key);
    rows.push({
      name,
      kind,
      quantities: codes.map((_, i) => parseNumber(values[i + 1] ?? "", name)),
    });
  }
  if (!rows.length || rows.length > 100) throw new Error("Provide 1–100 rows.");
  if (codes.some((_, i) => !rows.some((row) => row.quantities[i] > 0)))
    throw new Error("Each product needs a quantity greater than zero.");
  return { codes, rows, totals };
}

export function csvWarnings(parsed: ReturnType<typeof readRecipeCsv>) {
  const warnings: string[] = [];
  for (const total of parsed.totals) {
    const group = parsed.rows.filter((row) => row.kind === total.kind);
    parsed.codes.forEach((code, i) => {
      const stated = total.values[i];
      if (stated === null) return;
      const calculated = group.reduce((sum, row) => sum + row.quantities[i], 0);
      if (Math.abs(stated - calculated) > 0.01) {
        const label =
          total.kind === "ingredient" ? "Ingredients (kg)" : "Additives (g)";
        warnings.push(
          `${code}: ${label} total is ${Number(calculated.toFixed(6))}; CSV says ${stated}. Calculations use the individual rows.`,
        );
      }
    });
  }
  return warnings;
}
