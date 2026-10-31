"use client";
import type { Calculation, WorkerSheet } from "@/types/feed.types";
const n = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 6 });

export function ProfitSheet({
  sheet: s,
  brand,
}: {
  sheet: Calculation;
  brand: string;
}) {
  const analysis: [string, number][] = [
    ["TOTAL COST", s.totalCost],
    ["GOODS LOSS 2%", s.goodsLoss],
    ["UTILITY", s.inputs.utility],
    ["FREIGHT", s.inputs.freight],
    ["OVERHEAD COST", s.inputs.overhead],
    ["LABOUR COST", s.inputs.labour],
    ["GRAND TOTAL", s.grandTotal],
    ["PRICE/TON", s.inputs.pricePerTon],
    ["COMMISSION", s.inputs.commission],
    ["SALES/TON", s.salesPerTon],
    ["COST/TON", s.costPerTon],
    ["P/L PER TON", s.profitPerTon],
  ];
  const length = Math.max(
    s.ingredients.length,
    s.additives.length + 3,
    analysis.length,
  );
  return (
    <div id="feed-print" className="feed-paper profit-paper">
      <div className="sheet-band">
        {s.code} <span>{brand} · P/L calculation</span>
      </div>
      <table className="excel-sheet profit-sheet">
        <colgroup>
          <col style={{ width: "17%" }} />
          <col />
          <col />
          <col />
          <col style={{ width: "22%" }} />
          <col />
          <col />
          <col />
          <col style={{ width: "13%" }} />
          <col />
        </colgroup>
        <thead>
          <tr className="sheet-blue">
            <th>Ingredients</th>
            <th>KG</th>
            <th>PRICE</th>
            <th>AMOUNT</th>
            <th colSpan={4}>FEEDS ADDITIVES</th>
            <th colSpan={2}>P/L ANALYSIS</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length }, (_, i) => {
            const a = s.ingredients[i],
              b = s.additives[i - 1],
              p = analysis[i];
            return (
              <tr key={i}>
                <td className="sheet-name">{a?.name ?? ""}</td>
                <td className="sheet-yellow">{a ? n(a.quantity) : ""}</td>
                <td className="sheet-price">{a ? n(a.price) : ""}</td>
                <td className="sheet-amount">{a ? n(a.amount) : ""}</td>
                {i === 0 ? (
                  <>
                    <th className="sheet-green">Additives</th>
                    <th className="sheet-green">GRAM</th>
                    <th className="sheet-green">PRICE</th>
                    <th className="sheet-green">AMOUNT</th>
                  </>
                ) : b ? (
                  <>
                    <td className="sheet-name">{b.name}</td>
                    <td className="sheet-yellow">{n(b.quantity)}</td>
                    <td className="sheet-price">{n(b.price)}</td>
                    <td className="sheet-amount">{n(b.amount)}</td>
                  </>
                ) : i === s.additives.length + 1 ? (
                  <>
                    <td className="sheet-amount sheet-name">Total (B)</td>
                    <td className="sheet-lime">{n(s.additiveGrams)}</td>
                    <td className="sheet-lime" />
                    <td className="sheet-lime">{n(s.additiveAmount)}</td>
                  </>
                ) : i === s.additives.length + 2 ? (
                  <>
                    <td className="sheet-name">Bags (C)</td>
                    <td className="sheet-yellow">{s.inputs.bags} PCS</td>
                    <td className="sheet-price">{n(s.bagPrice)}</td>
                    <td className="sheet-amount">{n(s.bagAmount)}</td>
                  </>
                ) : (
                  <>
                    <td />
                    <td />
                    <td />
                    <td />
                  </>
                )}
                <td
                  className={
                    i < 7
                      ? "analysis-label"
                      : i === 11
                        ? "profit-label"
                        : "sales-label"
                  }
                >
                  {p?.[0]}
                </td>
                <td
                  className={
                    i < 7
                      ? "analysis-value"
                      : i === 11
                        ? "profit-label"
                        : "sales-value"
                  }
                >
                  {p ? n(p[1]) : ""}
                </td>
              </tr>
            );
          })}
          <tr>
            <th className="sheet-amount">Total (A)</th>
            <td className="sheet-yellow">{n(s.ingredientKg)}</td>
            <td className="sheet-price" />
            <td className="sheet-amount">{n(s.ingredientAmount)}</td>
            <th className="sheet-amount">Total (A+B+C)</th>
            <td className="sheet-lime">{n(s.recipeKg)} kg</td>
            <td className="sheet-lime" />
            <td className="sheet-lime">{n(s.totalCost)}</td>
            <td colSpan={2}>{brand}</td>
          </tr>
        </tbody>
      </table>
      <p className="sheet-note">
        Rates: NPR/kg. Additive amount = grams × rate ÷ 1,000. Costs use a
        nominal one-ton recipe. Actual recipe weight: {n(s.recipeKg)} kg.
        Price-column totals are sums of listed rates, not weighted average
        prices.
      </p>
    </div>
  );
}
export function BatchSheet({
  sheet: s,
  brand,
}: {
  sheet: WorkerSheet;
  brand: string;
}) {
  const batches = [1, 5, 10];

  return (
    <div id="feed-print" className="feed-paper batch-paper">
      <div className="sheet-band">
        {s.code}
        <span>{brand}</span>
      </div>

      <table className="excel-sheet batch-sheet">
        <colgroup>
          <col style={{ width: "46%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>

        <thead>
          <tr className="sheet-lime">
            <th className="sheet-name">Ingredients</th>
            <th>For 1 Batch</th>
            <th>For 5 Batch</th>
            <th>For 10 Batch</th>
          </tr>
        </thead>

        <tbody>
          {s.ingredients.map((row, index) => (
            <tr key={index}>
              <td className="sheet-name">{row.name}</td>

              {batches.map((count) => (
                <td key={count} className="batch-number">
                  {n(row.batchKg * count)}
                </td>
              ))}
            </tr>
          ))}

          <tr className="sheet-lime">
            <th>TOTAL INGREDIENTS</th>

            {batches.map((count) => (
              <td key={count} className="batch-number">
                {n(s.ingredientTotal * count)}
              </td>
            ))}
          </tr>

          <tr className="sheet-lime">
            <th className="sheet-name">Additives</th>
            <th>For 1 Batch</th>
            <th>For 5 Batch</th>
            <th>For 10 Batch</th>
          </tr>

          {s.additives.map((row, index) => (
            <tr key={index}>
              <td className="sheet-name">{row.name}</td>

              {batches.map((count) => (
                <td key={count} className="batch-number">
                  {n(row.one * count)}
                </td>
              ))}
            </tr>
          ))}

          <tr className="sheet-green">
            <th>TOTAL ADDITIVES</th>

            {batches.map((count) => (
              <td key={count}>{n(s.additiveOne * count)}</td>
            ))}
          </tr>

          <tr className="sheet-band">
            <th>Additives per batch</th>

            {batches.map((count) => (
              <td key={count}>{n((s.additiveOne * count) / count)}</td>
            ))}
          </tr>

          <tr className="sheet-lime">
            <th>TOTAL FEED (kg)</th>

            {batches.map((count) => (
              <td key={count} className="batch-number">
                {n(s.fullBatchKg * count)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <p className="sheet-note">
        All quantities are in kg. One batch is 80% of the reference recipe; five
        and ten batches are multiples of that quantity.
      </p>
    </div>
  );
}
