"use client";
import { useCallback, useState } from "react";
import {
  getFeedRates,
  getFeedSettings,
  saveBagPrice,
  saveFeedRates,
} from "@/api/feed.api";
import { useResource } from "@/hooks/resource.hook";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { ResourceState } from "@/components/ui/resource-state";
import { errorMessage } from "@/utils/api-error";
import { PRODUCTS, type Brand, type RateRecord } from "@/types/feed.types";

export function FeedRates() {
  const [brand, setBrand] = useState<Brand>("shraddha");
  const loader = useCallback(
    async () => ({
      rates: await getFeedRates(brand),
      settings: await getFeedSettings(),
    }),
    [brand],
  );
  const resource = useResource(loader);
  return (
    <div className="space-y-5">
      <Select
        id="rates-brand"
        label="Brand / group"
        value={brand}
        onChange={(e) => setBrand(e.target.value as Brand)}
      >
        {Object.keys(PRODUCTS).map((b) => (
          <option key={b} value={b}>
            {b.toUpperCase()}
          </option>
        ))}
      </Select>
      <ResourceState {...resource} retry={resource.reload} />
      {resource.data && (
        <RateEditor
          key={brand}
          brand={brand}
          rates={resource.data.rates}
          bagPrice={resource.data.settings.bagPrice}
        />
      )}
    </div>
  );
}
function RateEditor({
  brand,
  rates: initial,
  bagPrice,
}: {
  brand: Brand;
  rates: RateRecord[];
  bagPrice: number | null;
}) {
  const [rates, setRates] = useState(initial);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [bag, setBag] = useState(bagPrice === null ? "" : String(bagPrice));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  async function saveRates() {
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const changes = Object.entries(prices)
        .map(([id, value]) => {
          if (
            !value.trim() ||
            !Number.isFinite(Number(value)) ||
            Number(value) < 0 ||
            Number(value) > 1_000_000
          )
            throw new Error("Enter a valid price for each changed ingredient.");
          return { id, price: Number(value) };
        })
        .filter(
          (row) =>
            rates.find((rate) => rate._id === row.id)?.price !== row.price,
        );
      if (!changes.length) {
        setMessage("No price changes to save.");
        return;
      }
      await saveFeedRates(changes);
      // Reload dates and history after the server has saved the prices.
      setRates(await getFeedRates(brand));
      setPrices({});
      setMessage("Rates saved.");
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
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            setMessage("");
            try {
              if (!bag.trim()) throw new Error("Enter a bag price.");
              await saveBagPrice(Number(bag));
              setMessage(
                "Shared bag price saved for every brand. Recalculate existing sheets to use it.",
              );
            } catch (failure) {
              setError(errorMessage(failure));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            id="bag-price"
            label="Shared price per bag (NPR)"
            hint="One setting for all brands."
            type="number"
            min="0"
            max="1000000"
            step="any"
            required
            value={bag}
            disabled={busy}
            onChange={(e) => setBag(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            Save bag price
          </Button>
        </form>
      </Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Input
          id="find-rate"
          label="Find ingredient"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          pending={busy}
          onClick={() => void saveRates()}
          disabled={!Object.keys(prices).length}
        >
          Save price changes
        </Button>
      </div>
      {!rates.length && (
        <Card className="p-6 text-sm text-muted">
          No ingredients for this brand yet. A Director must upload its
          formulation CSV first.
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rates
          .filter((rate) =>
            rate.name.toLowerCase().includes(search.toLowerCase()),
          )
          .map((rate) => (
            <Card key={rate._id} className="space-y-3 p-4">
              <p className="text-xs text-muted">
                Rate per kg · applies to kg and gram quantities
              </p>
              <Input
                id={`rate-${rate._id}`}
                label={rate.name}
                hint="NPR per kg"
                type="number"
                inputMode="decimal"
                min="0"
                max="1000000"
                step="any"
                placeholder="Enter price"
                disabled={busy}
                value={
                  prices[rate._id] ??
                  (rate.price === null ? "" : String(rate.price))
                }
                onChange={(e) =>
                  setPrices({ ...prices, [rate._id]: e.target.value })
                }
              />
              <p className="text-xs text-muted">
                Last price change:{" "}
                {rate.changedAt
                  ? new Date(rate.changedAt).toLocaleString()
                  : "Not priced yet"}
              </p>
              <details className="text-xs">
                <summary className="cursor-pointer text-primary">
                  Price history
                </summary>
                <ul className="mt-2 max-h-32 space-y-2 overflow-auto">
                  {[...(rate.history ?? [])].reverse().map((item, i) => (
                    <li key={i}>
                      {new Date(item.date).toLocaleString()} · NPR {item.price}
                      /kg
                    </li>
                  ))}
                </ul>
              </details>
            </Card>
          ))}
      </div>
    </div>
  );
}
