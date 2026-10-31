import type { FeedResult } from "@/types/feed.types";
import { Card } from "@/components/ui/card";
import { feedDate, feedNumber as n } from "@/utils/feed";

export function FeedResults({ result }: { result: FeedResult }) {
  return (
    <section className="space-y-6" aria-label="Formulation results">
      {result.products.map((product) => (
        <Card key={product.code} className="feed-report overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <p className="text-xs font-semibold text-primary capitalize">
                {result.brand}
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {product.code} · Cost & batch sheet
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Profit / loss · NPR</p>
              <p
                className={`mt-1 text-2xl font-semibold ${product.profitLoss < 0 ? "text-red-700" : "text-primary"}`}
              >
                {n(product.profitLoss)}
              </p>
            </div>
          </div>
          <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <h3 className="mb-3 text-sm font-semibold">
                Ingredient costs & 800 kg batch
              </h3>
              <div className="overflow-x-auto">
                <table className="feed-table min-w-[660px] text-xs">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Recipe</th>
                      <th>NPR / kg</th>
                      <th>Cost · NPR</th>
                      <th>Batch × 0.8</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.ingredients.map((row) => (
                      <tr key={row.ingredientId}>
                        <td className="capitalize">
                          {row.name}
                          <span className="mt-1 block text-[10px] text-muted">
                            Rate: {feedDate(row.rateDate)}
                          </span>
                        </td>
                        <td>
                          {n(row.quantity, 6)} {row.unit}
                        </td>
                        <td>{n(row.price)}</td>
                        <td>{n(row.amount)}</td>
                        <td className="font-semibold text-primary">
                          {n(row.batchQuantity, 6)} {row.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-canvas font-semibold">
                      <td>Total</td>
                      <td>{n(product.totalKg, 6)} kg</td>
                      <td />
                      <td>{n(product.ingredientCost)}</td>
                      <td>{n(product.actualBatchKg, 6)} kg</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {Math.abs(product.actualBatchKg - 800) > 0.000001 && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  Actual batch weight is {n(product.actualBatchKg, 6)} kg. The
                  recipe totals {n(product.totalKg, 6)} kg; quantities are
                  scaled by 0.8 from a nominal 1,000 kg recipe.
                </p>
              )}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">
                P/L · full recipe (NPR)
              </h3>
              <dl className="rounded-lg border border-line bg-canvas p-4 text-sm">
                {[
                  ["Ingredients", product.ingredientCost],
                  ["Bag cost", product.bagCost],
                  [`Loss (${n(product.lossPercent)}%)`, product.lossCost],
                  ["Overheads", product.overheadCost],
                  ["Total cost", product.totalCost],
                  ["Selling amount", product.sellingPrice],
                  ["Commission", product.commission],
                  ["Profit / loss", product.profitLoss],
                ].map(([label, value]) => (
                  <div
                    className={`flex justify-between gap-4 py-2 ${label === "Total cost" || label === "Profit / loss" ? "border-t border-line font-semibold" : "text-muted"}`}
                    key={label}
                  >
                    <dt>{label}</dt>
                    <dd className="tabular-nums">{n(Number(value))}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-5 text-muted">
                Loss applies to ingredients + bag cost. Profit / loss = selling
                amount − commission − total cost. Monetary totals refer to the
                full recipe, not the 800 kg batch.
              </p>
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
