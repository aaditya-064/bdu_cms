"use client";
import { useState } from "react";
import Link from "next/link";
import { getRates, updateRates } from "@/api/feed.api";
import { useResource } from "@/hooks/resource.hook";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { ResourceState } from "@/components/ui/resource-state";
import { errorMessage } from "@/utils/api-error";
import { feedDate, feedNumber, parseRateCsv } from "@/utils/feed";
import type { IngredientRate, RateInput } from "@/types/feed.types";

export function RatesPage() {
  const resource = useResource(getRates);
  return (
    <>
      <PageHeading
        eyebrow="Feed management"
        title="Ingredient rates"
        description="Update one price or your entire rate sheet. All prices are in NPR per kg, including additives entered in grams."
        action={
          <Link className={buttonStyles("secondary")} href="/formulations">
            Formulations
          </Link>
        }
      />
      <ResourceState {...resource} retry={resource.reload} />
      {resource.data && <RatesEditor initial={resource.data} />}
    </>
  );
}

function RatesEditor({ initial }: { initial: IngredientRate[] }) {
  const [rates, setRates] = useState(initial);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState<RateInput[]>([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<"kg" | "g">("kg");
  const [price, setPrice] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const pending =
    rates.filter(
      (row) =>
        draft[`${row.name}:price`] !== undefined &&
        (draft[`${row.name}:price`].trim() === "" ||
          Number(draft[`${row.name}:price`]) !== row.price),
    ).length + extra.length;
  const rows: (RateInput & Partial<IngredientRate>)[] = [
    ...rates,
    ...extra,
  ].filter((row) => row.name.toLowerCase().includes(search.toLowerCase()));

  function stage(input: RateInput[]) {
    const nextDraft = { ...draft },
      nextExtra = [...extra];
    for (const row of input) {
      const old =
        rates.find((item) => item.name === row.name) ??
        nextExtra.find((item) => item.name === row.name);
      if (old && old.unit !== row.unit)
        throw new Error(
          `Keep ${row.name} in ${old.unit}; existing units cannot be changed.`,
        );
      if (rates.some((item) => item.name === row.name))
        nextDraft[`${row.name}:price`] = String(row.price);
      else {
        const index = nextExtra.findIndex((item) => item.name === row.name);
        if (index >= 0) nextExtra[index] = row;
        else nextExtra.push(row);
        nextDraft[`${row.name}:price`] = String(row.price);
      }
    }
    setDraft(nextDraft);
    setExtra(nextExtra);
    setMessage(null);
    setError(null);
  }
  async function save() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const changes = [...rates, ...extra]
        .filter(
          (row) =>
            !("_id" in row) ||
            (draft[`${row.name}:price`] !== undefined &&
              Number(draft[`${row.name}:price`]) !== row.price),
        )
        .map((row) => {
          const value = draft[`${row.name}:price`] ?? String(row.price);
          if (
            !value.trim() ||
            !Number.isFinite(Number(value)) ||
            Number(value) < 0 ||
            Number(value) > 1_000_000
          )
            throw new Error(`Enter a valid price for ${row.name}.`);
          return { name: row.name, unit: row.unit, price: Number(value) };
        });
      // Blank is invalid even when the previous stored price was zero.
      if (Object.values(draft).some((value) => !value.trim()))
        throw new Error("Fill in every changed price before saving.");
      if (!changes.length) return;
      if (changes.length > 100)
        throw new Error("Save no more than 100 changed rates at a time.");
      setRates(await updateRates(changes));
      setDraft({});
      setExtra([]);
      setMessage(
        `${changes.length} ingredient rate${changes.length === 1 ? "" : "s"} saved.`,
      );
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      {error && <Notice>{error}</Notice>}
      {message && <Notice success>{message}</Notice>}
      <Card className="p-5">
        <form
          className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              stage([
                { name: name.trim().toLowerCase(), unit, price: Number(price) },
              ]);
              setName("");
              setPrice("");
            } catch (failure) {
              setError(errorMessage(failure));
            }
          }}
        >
          <Input
            id="ingredient-name"
            label="Ingredient name"
            placeholder="e.g. Maize"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            pattern=".*\S.*"
          />
          <Select
            id="ingredient-unit"
            label="Recipe quantity unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as "kg" | "g")}
            disabled={busy}
          >
            <option value="kg">Kilograms (kg)</option>
            <option value="g">Grams (g)</option>
          </Select>
          <Input
            id="ingredient-price"
            label="Rate (NPR / kg)"
            type="number"
            min="0"
            max="1000000"
            step="any"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={busy}
          />
          <Button type="submit" variant="secondary" disabled={busy}>
            Add to rate sheet
          </Button>
        </form>
        <details className="mt-5 border-t border-line pt-4 text-sm">
          <summary className="cursor-pointer font-medium text-primary">
            Upload a daily rate sheet (CSV)
          </summary>
          <p className="my-3 text-muted">
            Export Excel as CSV with headings <code>name,unit,price</code>.
            Example: <code>Maize,kg,40</code>. Use kg or g for the recipe unit;
            prices are always per kg. Uploaded changes appear below for review
            before saving.
          </p>
          <input
            aria-label="Upload ingredient rates CSV"
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            className="block max-w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-canvas file:px-4 file:py-2"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              try {
                if (file.size > 200_000)
                  throw new Error("Choose a CSV smaller than 200 KB.");
                stage(parseRateCsv(await file.text()));
              } catch (failure) {
                setError(errorMessage(failure));
              }
            }}
          />
        </details>
      </Card>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 p-5">
          <Input
            id="rate-search"
            label="Find ingredient"
            placeholder="Search ingredients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted">
              {pending} unsaved changes
            </span>
            <Button
              variant="ghost"
              disabled={busy || !pending}
              onClick={() => {
                setDraft({});
                setExtra([]);
                setError(null);
              }}
            >
              Discard changes
            </Button>
            <Button
              pending={busy}
              disabled={!pending}
              onClick={() => void save()}
            >
              Save rates
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="feed-table min-w-[680px]">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Recipe unit</th>
                <th>Rate · NPR / kg</th>
                <th>Last price change</th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td className="font-medium capitalize">
                    {row.name}
                    {!("_id" in row) && (
                      <span className="ml-2 text-xs text-primary">New</span>
                    )}
                  </td>
                  <td>{row.unit}</td>
                  <td>
                    <input
                      aria-label={`${row.name} price per kg`}
                      type="number"
                      min="0"
                      max="1000000"
                      step="any"
                      className="feed-input w-32"
                      disabled={busy}
                      value={draft[`${row.name}:price`] ?? row.price}
                      onChange={(e) => {
                        setDraft({
                          ...draft,
                          [`${row.name}:price`]: e.target.value,
                        });
                        setMessage(null);
                      }}
                    />
                  </td>
                  <td className="text-muted">
                    {row.updatedAt ? (
                      <>
                        {feedDate(row.updatedAt)}
                        {typeof row.updatedBy === "object" && (
                          <span className="mt-1 block text-xs">
                            {row.updatedBy.full_name}
                          </span>
                        )}
                      </>
                    ) : (
                      "Not saved yet"
                    )}
                  </td>
                  <td>
                    {row.history ? (
                      <details>
                        <summary className="cursor-pointer text-primary">
                          View ({row.history.length})
                        </summary>
                        <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs">
                          {[...row.history].reverse().map((item, index) => (
                            <li key={index}>
                              {feedDate(item.date)} · NPR{" "}
                              {feedNumber(item.price)}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <p className="p-10 text-center text-sm text-muted">
            {rates.length || extra.length
              ? "No matching ingredients."
              : "Add your ingredients and current prices to start creating formulations."}
          </p>
        )}
      </Card>
    </div>
  );
}
