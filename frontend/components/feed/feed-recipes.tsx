"use client";
import { Fragment, useCallback, useState } from "react";
import {
  calculateRecipe,
  getFeedRecipe,
  importRecipe,
  listFeedRecipes,
} from "@/api/feed.api";
import { useResource } from "@/hooks/resource.hook";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { ResourceState } from "@/components/ui/resource-state";
import { errorMessage } from "@/utils/api-error";
import { readRecipeCsv } from "@/utils/feed-csv";
import {
  PRODUCTS,
  type Brand,
  type Costs,
  type SavedRecipe,
} from "@/types/feed.types";
import { ProfitSheet } from "./feed-sheets";

export function FeedRecipes() {
  const [id, setId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const resource = useResource(listFeedRecipes);
  if (id)
    return (
      <RecipeDetail
        id={id}
        back={() => {
          setId(null);
          void resource.reload();
        }}
      />
    );
  return (
    <div className="space-y-5">
      <Button onClick={() => setAdding(!adding)}>
        {adding ? "Close upload" : "Upload formulation CSV"}
      </Button>
      {adding && <RecipeUpload opened={setId} />}
      <ResourceState {...resource} retry={resource.reload} />
      <div className="grid gap-3 sm:grid-cols-2">
        {resource.data?.map((recipe) => (
          <Card key={recipe._id} className="p-5">
            <p className="text-xs text-primary uppercase">
              {recipe.brand} · {recipe.codes.join(" / ")}
            </p>
            <h2 className="my-2 font-semibold">{recipe.title}</h2>
            <p className="mb-4 text-xs text-muted">
              {recipe.publishedAt
                ? `Saved ${new Date(recipe.publishedAt).toLocaleString()}`
                : "Imported · waiting for calculation"}
            </p>
            <Button variant="secondary" onClick={() => setId(recipe._id)}>
              Open formulation
            </Button>
          </Card>
        ))}
      </div>
      {resource.data?.length === 0 && (
        <p className="text-sm text-muted">Upload your first recipe to begin.</p>
      )}
    </div>
  );
}
function RecipeUpload({ opened }: { opened: (id: string) => void }) {
  const [brand, setBrand] = useState<Brand>("shraddha");
  const [title, setTitle] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof readRecipeCsv> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card className="p-5">
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!parsed) return;
          setBusy(true);
          setError(null);
          try {
            const saved = await importRecipe({
              title,
              brand,
              codes: parsed.codes,
              rows: parsed.rows,
            });
            opened(saved._id);
          } catch (failure) {
            setError(errorMessage(failure));
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="recipe-title"
              label="Formulation title"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Select
              id="recipe-brand"
              label="Brand / group"
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value as Brand);
                setParsed(null);
                setError(null);
              }}
            >
              {Object.keys(PRODUCTS).map((b) => (
                <option key={b} value={b}>
                  {b.toUpperCase()}
                </option>
              ))}
            </Select>
          </div>
          <div className="rounded-lg border border-dashed border-line bg-canvas p-5">
            <label
              htmlFor="recipe-file"
              className="mb-3 block text-sm font-semibold"
            >
              Upload your recipe CSV
            </label>
            <input
              id="recipe-file"
              type="file"
              accept=".csv,text/csv"
              className="max-w-full text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setBusy(true);
                setParsed(null);
                setError(null);
                try {
                  if (file.size > 200_000)
                    throw new Error("Use a CSV smaller than 200 KB.");
                  const result = readRecipeCsv(await file.text(), brand);
                  setParsed(result);
                  if (!title)
                    setTitle(file.name.replace(/\.csv$/i, "").slice(0, 100));
                } catch (failure) {
                  setError(errorMessage(failure));
                } finally {
                  setBusy(false);
                }
              }}
            />
            <p className="mt-3 text-xs leading-5 text-muted">
              Headings: Ingredients,{PRODUCTS[brand].join(",")}. Include an
              Additives row before the gram quantities. Rates are linked
              separately for this brand.
            </p>
          </div>
          {error && <Notice>{error}</Notice>}
          {parsed && (
            <>
              <p className="text-sm text-primary">
                Read {parsed.rows.length} rows. Check the quantities before
                importing.
              </p>
              {parsed.warnings.map((warning, i) => (
                <Notice key={i}>{warning}</Notice>
              ))}
              <div className="overflow-x-auto">
                <table className="feed-preview">
                  <thead>
                    <tr>
                      <th>Ingredients (kg)</th>
                      {parsed.codes.map((code) => (
                        <th key={code}>{code}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(["ingredient", "additive"] as const).map((kind) => (
                      <Fragment key={kind}>
                        {kind === "additive" && (
                          <tr>
                            <th colSpan={parsed.codes.length + 1}>
                              Additives (grams)
                            </th>
                          </tr>
                        )}
                        {parsed.rows
                          .filter((row) => row.kind === kind)
                          .map((row, i) => (
                            <tr key={i}>
                              <td>{row.name}</td>
                              {row.quantities.map((q, j) => (
                                <td key={j}>{q}</td>
                              ))}
                            </tr>
                          ))}
                        <tr className="font-semibold">
                          <td>{kind === "ingredient" ? "Total" : "TOTAL"}</td>
                          {parsed.codes.map((code, i) => (
                            <td key={code}>
                              {Number(
                                parsed.rows
                                  .filter((row) => row.kind === kind)
                                  .reduce(
                                    (sum, row) => sum + row.quantities[i],
                                    0,
                                  )
                                  .toFixed(6),
                              )}
                            </td>
                          ))}
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button type="submit" pending={busy}>
                Import recipe & link rates
              </Button>
            </>
          )}
        </fieldset>
      </form>
    </Card>
  );
}
function RecipeDetail({ id, back }: { id: string; back: () => void }) {
  const loader = useCallback(() => getFeedRecipe(id), [id]);
  const resource = useResource(loader);
  return (
    <>
      <div className="feed-controls mb-5">
        <Button variant="secondary" onClick={back}>
          All formulations
        </Button>
      </div>
      <ResourceState {...resource} retry={resource.reload} />
      {resource.data && <CostEditor initial={resource.data} />}
    </>
  );
}
const fields: [keyof Costs, string][] = [
  ["bags", "Number of bags"],
  ["overhead", "Overhead (NPR)"],
  ["utility", "Utility (NPR)"],
  ["freight", "Freight (NPR)"],
  ["labour", "Labour (NPR)"],
  ["pricePerTon", "Price / ton (NPR)"],
  ["commission", "Commission / ton (NPR)"],
];
function CostEditor({ initial }: { initial: SavedRecipe }) {
  const [recipe, setRecipe] = useState(initial);
  const [code, setCode] = useState(initial.codes[0]);
  const [costs, setCosts] = useState<Record<string, Costs>>(() =>
    Object.fromEntries(
      initial.codes.map((code) => [
        code,
        initial.sheets.find((s) => s.code === code)?.inputs ?? {
          bags: 20,
          overhead: 0,
          utility: 0,
          freight: 0,
          labour: 0,
          pricePerTon: 0,
          commission: 0,
        },
      ]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheet = recipe.sheets.find((sheet) => sheet.code === code);
  return (
    <div className="space-y-5">
      <div className="feed-controls space-y-5">
        <div>
          <h2 className="text-xl font-semibold">{recipe.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {recipe.brand.toUpperCase()} · Ingredient rates and the shared bag
            price are read when calculating. Goods loss is fixed at 2%.
          </p>
        </div>
        {error && <Notice>{error}</Notice>}
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              setRecipe(await calculateRecipe(recipe._id, costs));
              setDirty(false);
            } catch (failure) {
              setError(errorMessage(failure));
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy} className="grid gap-4 lg:grid-cols-3">
            {recipe.codes.map((product) => (
              <Card key={product} className="space-y-3 p-4">
                <h3 className="font-semibold text-primary">{product}</h3>
                {fields.map(([key, label]) => (
                  <Input
                    key={key}
                    id={`${product}-${key}`}
                    label={label}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="1000000"
                    step={key === "bags" ? "1" : "any"}
                    required
                    value={costs[product][key]}
                    onChange={(e) => {
                      setCosts({
                        ...costs,
                        [product]: {
                          ...costs[product],
                          [key]: Number(e.target.value),
                        },
                      });
                      setDirty(true);
                    }}
                  />
                ))}
              </Card>
            ))}
          </fieldset>
          <p className="text-xs text-muted">
            Extra costs are totals for the nominal one-ton recipe. The default
            is 20 bags; adjust the count if needed. Enter your actual selling
            price per ton.
          </p>
          <Button type="submit" pending={busy}>
            Calculate, save & publish batch sheets
          </Button>
        </form>
        {dirty && (
          <Notice>
            Costs have changed. Recalculate to update the saved sheets before
            printing.
          </Notice>
        )}
        {sheet && (
          <p className="text-xs text-muted">
            Saved calculation: {new Date(recipe.publishedAt!).toLocaleString()}.
            Updating rates later does not alter this saved sheet until you
            recalculate.
          </p>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <Select
            id="sheet-code"
            label="Product sheet"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          >
            {recipe.codes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Button
            variant="secondary"
            disabled={!sheet || dirty}
            onClick={() => window.print()}
          >
            Print P/L / Save PDF
          </Button>
        </div>
      </div>
      {sheet && (
        <div className="feed-overflow overflow-x-auto">
          <ProfitSheet sheet={sheet} brand={recipe.brand} />
        </div>
      )}
      {!sheet && (
        <Card className="feed-controls p-5 text-sm text-muted">
          Set this brand’s ingredient prices in the Rates tab, then calculate to
          generate the P/L and worker sheets.
        </Card>
      )}
    </div>
  );
}
