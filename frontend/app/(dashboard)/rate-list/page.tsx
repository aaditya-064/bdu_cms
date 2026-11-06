"use client";

import { useState, type FormEvent } from "react";
import {
  getProductRates,
  saveProductRates,
  type ProductRateSheet,
} from "@/api/rateList.api";
import { Button } from "@/components/ui/button";
import { useResource } from "@/hooks/resource.hook";
import { errorMessage } from "@/utils/api-error";

export default function FeedRatesPage() {
  const resource = useResource(getProductRates);

  if (resource.loading) {
    return <p className="p-4 text-sm text-muted">Loading feed rates…</p>;
  }

  if (resource.error || !resource.data) {
    return (
      <div className="space-y-3 p-4">
        <p role="alert">{resource.error ?? "Could not load feed rates."}</p>
        <Button variant="secondary" onClick={() => void resource.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <RateTable
      key={resource.data.revision}
      sheet={resource.data}
      reload={resource.reload}
    />
  );
}

function RateTable({
  sheet,
  reload,
}: {
  sheet: ProductRateSheet;
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sheet.canEdit || !editing || saving) return;

    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");

    try {
      const rows = sheet.rows.map((row, index) => {
        const rate = String(form.get(`rate-${index}`) ?? "").trim();
        const outside = String(form.get(`outside-${index}`) ?? "").trim();

        if (!rate) throw new Error(`Enter the new rate for ${row.product}.`);

        return {
          product: row.product,
          rate: Number(rate),
          outOfValley: outside === "" ? null : Number(outside),
        };
      });

      await saveProductRates({
        effectiveDate: String(form.get("effectiveDate") ?? "").trim(),
        revision: sheet.revision,
        rows,
      });

      setEditing(false);
      await reload();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  const cell = "border border-slate-300 px-2 py-2 text-center";
  const input =
    "min-h-10 w-full min-w-0 rounded border border-slate-300 bg-white " +
    "px-1 text-center text-base text-slate-900 focus:border-primary";

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Feed Rates</h1>

        {sheet.canEdit && !editing && (
          <Button onClick={() => setEditing(true)}>Edit rates</Button>
        )}
      </div>

      <form onSubmit={submit}>
        <fieldset disabled={saving} className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <header className="space-y-1 p-4 text-center font-bold text-sky-700">
              <h2 className="text-xl sm:text-2xl">
                Buddha Dana Udhyog Pvt Ltd
              </h2>
              <p>Siyari 05-Chappiya, Rupandehi</p>

              {editing ? (
                <label className="inline-flex items-center gap-2 text-sm">
                  Effective from (BS)
                  <input
                    name="effectiveDate"
                    required
                    placeholder="2083.07.18"
                    defaultValue={sheet.effectiveDate}
                    className="w-32 rounded border border-line p-2 text-center"
                  />
                </label>
              ) : (
                <p>Effective from {sheet.effectiveDate} BS</p>
              )}
            </header>

            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col className="w-[44%]" />
                <col className="w-[28%]" />
                <col className="w-[28%]" />
              </colgroup>
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className={cell}>
                    Product items
                  </th>
                  <th scope="col" className={cell}>
                    New rate
                  </th>
                  <th scope="col" className={cell}>
                    Out of Valley
                  </th>
                </tr>
              </thead>

              <tbody>
                {sheet.rows.map((row, index) => (
                  <tr key={row.product}>
                    <th scope="row" className={`${cell} font-semibold`}>
                      {row.product}
                    </th>
                    <td className={cell}>
                      {editing ? (
                        <input
                          name={`rate-${index}`}
                          aria-label={`${row.product} new rate`}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="any"
                          required
                          defaultValue={row.rate}
                          className={input}
                        />
                      ) : (
                        row.rate
                      )}
                    </td>
                    <td className={cell}>
                      {editing ? (
                        <input
                          name={`outside-${index}`}
                          aria-label={`${row.product} out-of-valley rate`}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="any"
                          defaultValue={row.outOfValley ?? ""}
                          className={input}
                        />
                      ) : (
                        (row.outOfValley ?? "")
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <div role="alert" className="space-y-2 text-sm text-red-700">
              <p>{error}</p>
              <Button variant="secondary" onClick={() => void reload()}>
                Reload saved rates
              </Button>
            </div>
          )}

          {editing && (
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setError("");
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" pending={saving}>
                Save rates
              </Button>
            </div>
          )}
        </fieldset>
      </form>
    </section>
  );
}
