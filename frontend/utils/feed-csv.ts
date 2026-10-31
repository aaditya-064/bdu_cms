import {
  PRODUCTS,
  type Brand,
  type Kind,
  type RecipeRow,
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
  const header = cells.shift() ?? [];
  while (header.length && !header[header.length - 1]) header.pop();
  if (!/^(ingredient|ingredients)$/i.test(header[0] ?? ""))
    throw new Error(
      "First row must be Ingredients,B0,B1,B2 (or the codes for your selected brand).",
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
  const rows: RecipeRow[] = [],
    warnings: string[] = [],
    names = new Set<string>();
  for (const values of cells) {
    const name = values[0].trim().replace(/\s+/g, " ");
    if (/^(feed\s+)?additives$/i.test(name)) {
      kind = "additive";
      continue;
    }
    if (/^total(?:\s*\([ab]\))?$/i.test(name)) {
      const group = rows.filter((row) => row.kind === kind);
      codes.forEach((code, i) => {
        const stated = Number((values[i + 1] ?? "").replace(/,/g, ""));
        const actual = group.reduce((sum, row) => sum + row.quantities[i], 0);
        if (
          values[i + 1] &&
          Number.isFinite(stated) &&
          Math.abs(stated - actual) > 0.01
        )
          warnings.push(
            `${code} ${kind} total in CSV is ${stated}; row sum is ${Number(actual.toFixed(6))}. Row values will be used.`,
          );
      });
      continue;
    }
    if (!name || name.length > 100 || values.slice(header.length).some(Boolean))
      throw new Error(`Check the row for ${name || "unnamed ingredient"}.`);
    const key = `${kind}:${name.toLowerCase()}`;
    if (names.has(key)) throw new Error(`Duplicate ${kind}: ${name}.`);
    names.add(key);
    const quantities = codes.map((_, i) => {
      const value = (values[i + 1] ?? "").replace(/,/g, "");
      const quantity = value === "" ? 0 : Number(value);
      if (!Number.isFinite(quantity) || quantity < 0 || quantity > 100_000)
        throw new Error(`Invalid quantity for ${name}.`);
      return quantity;
    });
    rows.push({ name, kind, quantities });
  }
  if (!rows.length || rows.length > 100)
    throw new Error("Provide 1–100 recipe ingredients/additives.");
  if (codes.some((_, i) => !rows.some((row) => row.quantities[i] > 0)))
    throw new Error("Each product needs a quantity greater than zero.");
  return { codes, rows, warnings };
}
