"use client";
import { useAuth } from "@/hooks/auth.hook";
import type { Calculation, CostRow, WorkerSheet } from "@/types/feed.types";
import { toKg } from "@/types/feed.types";

const n = (value: number, places = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
const kg = (row: CostRow, additive: boolean) =>
  row.quantityKg ?? toKg(row.quantity, row.unit ?? (additive ? "g" : "kg"));
const dateText = (date?: string) =>
  date ? new Date(date).toLocaleDateString("en-GB") : "";

export function ProfitSheet({
  sheet: s,
  brand,
  publishedAt,
}: {
  sheet: Calculation;
  brand: string;
  publishedAt?: string;
}) {
  const additiveKg = s.additiveKg ?? s.additiveGrams / 1000;
  const analysis: [string, number, string][] = [
    ["TOTAL COST OF RM", s.totalCost, "gold"],
    ["GOODS LOSS 2%", s.goodsLoss, "expense"],
    ["UTILITY", s.inputs.utility, "expense"],
    ["MANUFACTURE COST", s.inputs.labour, "expense"],
    ["OVERHEAD COST", s.inputs.overhead, "expense"],
    ["FIRE WOOD (STEAM SECTION)", s.inputs.firewood ?? 0, "expense"],
    ["FREIGHT", s.inputs.freight, "expense"],
    ["COST OF GOODS SALES", s.costPerTon, "cost"],
    ["SALES PRICE/TON (GROSS)", s.inputs.pricePerTon, "gross"],
    ["COMMISSION", s.inputs.commission, "sales"],
    ["SALES PRICE/TON (NET)", s.salesPerTon, "cost"],
    ["COST OF GOODS SALES", s.costPerTon, "gold"],
    ["P/L PER TON", s.profitPerTon, "profit"],
  ];
  const rows = (items: CostRow[], additive: boolean) =>
    items.map((r, i) => (
      <tr key={i}>
        <td className="sheet-name">{r.name}</td>
        <td className="sheet-yellow">{n(kg(r, additive), additive ? 3 : 2)}</td>
        <td className="sheet-price">{n(r.price)}</td>
        <td className="sheet-amount">{n(r.amount)}</td>
      </tr>
    ));
  const columns = (
    <colgroup>
      <col style={{ width: "48%" }} />
      <col style={{ width: "18%" }} />
      <col style={{ width: "14%" }} />
      <col style={{ width: "20%" }} />
    </colgroup>
  );
  return (
    <article className="feed-paper profit-paper feed-print">
      <div className="sheet-band">
        <b>{s.code}</b>
        <span>{brand.toUpperCase()}</span>
      </div>
      <div className="profit-grid">
        <table
          className="excel-sheet"
          aria-label="Ingredients and additives costs"
        >
          {columns}
          <thead>
            <tr className="sheet-green">
              <th>Ingredients/ADDITIVES</th>
              <th>KG</th>
              <th>PRICE</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {rows(s.additives, true)}
            <tr className="sheet-total">
              <th>Total (A)</th>
              <td>{n(additiveKg)}</td>
              <td />
              <td>{n(s.additiveAmount)}</td>
            </tr>
          </tbody>
        </table>
        <div>
          <table className="excel-sheet" aria-label="Ingredient and bag costs">
            {columns}
            <thead>
              <tr className="sheet-blue">
                <th>Ingredients</th>
                <th>KG</th>
                <th>PRICE</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {rows(s.ingredients, false)}
              <tr className="sheet-total">
                <th>Total (B)</th>
                <td>{n(s.ingredientKg)}</td>
                <td />
                <td>{n(s.ingredientAmount)}</td>
              </tr>
              <tr className="sheet-total">
                <th>Bags (C)</th>
                <td>{s.inputs.bags} PCS</td>
                <td>{n(s.bagPrice)}</td>
                <td>{n(s.bagAmount)}</td>
              </tr>
              <tr className="sheet-total">
                <th>Total (A+B+C)</th>
                <td>{n(s.recipeKg)}</td>
                <td />
                <td>{n(s.totalCost)}</td>
              </tr>
            </tbody>
          </table>
          <div className="sheet-footer">
            <b>{s.code}</b> · {brand.toUpperCase()}
          </div>
        </div>
        <div>
          <table
            className="excel-sheet analysis-table"
            aria-label="Profit and loss analysis"
          >
            <colgroup>
              <col style={{ width: "66%" }} />
              <col style={{ width: "34%" }} />
            </colgroup>
            <thead>
              <tr className="sheet-blue">
                <th colSpan={2}>P/L ANALYSIS</th>
              </tr>
            </thead>
            <tbody>
              {analysis.map(([label, value, colour], i) => (
                <tr key={i} className={`analysis-${colour}`}>
                  <th>{label}</th>
                  <td>{n(value, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="sheet-footer">
            {dateText(publishedAt)}
            <br />
            {brand.toUpperCase()}
          </div>
        </div>
      </div>
    </article>
  );
}

export function BatchSheet({
  sheet: s,
  brand,
  publishedAt,
}: {
  sheet: WorkerSheet;
  brand: string;
  publishedAt?: string;
}) {
  const { user } = useAuth();
  const role = user?.role;
  const canAccess = role === "ADMIN" || role === "DIRECTOR";
  return (
    <article className="feed-paper batch-paper feed-print">
      <div className="sheet-band">
        <b>{s.code}</b>
        <span>{brand.toUpperCase()}</span>
      </div>
      <table
        className="excel-sheet"
        aria-label={`${s.code} worker batch quantities in kg`}
      >
        <colgroup>
          <col style={{ width: "28%" }} />
          {canAccess && <col style={{ width: "13%" }} />}
          <col style={{ width: "13%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "13%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Ingredients</th>
            {canAccess && <th>{s.code} (kg)</th>}
            <th>{s.code} 800 kg Batch</th>
            <th colSpan={2}>{brand}</th>
          </tr>
        </thead>
        <tbody>
          {s.ingredients.map((r, i) => (
            <tr key={i}>
              <td className="sheet-name">{r.name}</td>
              {canAccess && (
                <td className="sheet-reference">{n(r.referenceKg, 3)}</td>
              )}
              <td className="batch-number">{n(r.batchKg, 3)}</td>
              {brand === "layers" ? <td>shraddha</td> : <td />}
              {brand === "sirjan" ? <td>sirjan</td> : <td />}
            </tr>
          ))}
          <tr className="sheet-green">
            <th>Total</th>
            {canAccess && <td>{n(s.ingredientReference)}</td>}
            <td>{n(s.ingredientTotal)}</td>
            <td />
            <td />
          </tr>
          <tr className="sheet-lime">
            <th>Additives / Ingredients</th>
            {canAccess && <th>{s.code} (kg)</th>}
            <th>For 1 Batch</th>
            <th>For 5 Batch</th>
            <th>For 10 Batch</th>
          </tr>
          {s.additives.map((r, i) => (
            <tr key={i}>
              <td className="sheet-name">{r.name}</td>
              {canAccess && (
                <td className="sheet-reference">{n(r.referenceKg, 3)}</td>
              )}
              <td className="batch-number">{n(r.one, 3)}</td>
              <td className="batch-number">{n(r.five, 3)}</td>
              <td className="batch-number">{n(r.ten, 3)}</td>
            </tr>
          ))}
          <tr className="sheet-green">
            <th>TOTAL</th>
            {canAccess && <td>{n(s.additiveReference)}</td>}
            <td>{n(s.additiveOne)}</td>
            <td>{n(s.additiveFive)}</td>
            <td>{n(s.additiveTen)}</td>
          </tr>
          <tr className="sheet-cyan">
            <th>Average additives / batch (kg)</th>
            {canAccess && <td />}
            <td>{n(s.additiveOne)}</td>
            <td>{n(s.additiveFive / 5)}</td>
            <td>{n(s.additiveTen / 10)}</td>
          </tr>
          <tr>
            <th>Full feed (kg)</th>
            {canAccess && <td>{n(s.referenceKg)}</td>}
            <td className="batch-number">{n(s.fullBatchKg)}</td>
            <td colSpan={2}>{dateText(publishedAt)}</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
