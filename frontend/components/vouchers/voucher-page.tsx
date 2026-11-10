"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { useAuth } from "@/hooks/auth.hook";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ConfirmDelete } from "@/components/ui/confirm-delete";

import {
  getVouchers,
  getVoucher,
  saveVoucher,
  updateVoucher,
  deleteVoucher,
} from "@/api/voucher.api";

import {
  canUseVouchers,
  type Voucher,
  type VoucherInput,
  type VoucherKind,
} from "@/types/voucher.types";

import { amountInWords } from "@/utils/amount-in-words";
import { VoucherPrint } from "./voucher-print";

const inputClass =
  "mt-1 w-full rounded-lg border border-line " +
  "bg-white px-3 py-2.5 text-sm text-ink " +
  "focus:border-primary";

const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";

type Field = {
  name: keyof VoucherInput;
  label: string;
  max?: number;
  optional?: boolean;
};

function VoucherForm({
  kind,
  record,
  onSaved,
  onCancel,
}: {
  kind: VoucherKind;
  record?: Voucher;
  onSaved: (record: Voucher) => void;
  onCancel: () => void;
}) {
  const [method, setMethod] = useState<"CASH" | "CHEQUE">(
    record?.paymentMethod ?? "CASH",
  );

  const [amount, setAmount] = useState(
    record ? (record.amountPaisa / 100).toFixed(2) : "",
  );

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const words = amountInWords(amount);
  const saving = useRef(false);

  const attempt = useRef<{
    id: string;
    body: string;
  } | null>(null);

  const fields: Field[] = [
    {
      name: "dateBs",
      label: "मिति / BS date (2083/07/24)",
      max: 10,
    },
    {
      name: "personName",
      label:
        kind === "rasid" ? "श्री / Received from" : "बस्ने / Recipient name",
    },

    ...(kind === "rasid"
      ? ([
          {
            name: "address",
            label: "स्थान / Address",
            max: 100,
          },
          {
            name: "receivedThrough",
            label: "हस्ते / Received through",
            optional: true,
          },
        ] as Field[])
      : ([
          {
            name: "municipality",
            label: "गा.पा./न.पा. / Municipality",
          },
          {
            name: "ward",
            label: "वडा नं. / Ward",
            max: 10,
          },
          {
            name: "tole",
            label: "टोल / Tole",
          },
          {
            name: "purpose",
            label: "वापत / Payment purpose",
            max: 160,
          },
          {
            name: "dayName",
            label: "रोज / Weekday in Nepali",
            max: 20,
          },
        ] as Field[])),

    {
      name: "amount",
      label: "रकम / Amount in NPR",
      max: 20,
    },
    {
      name: "amountWords",
      label: "अक्षरूपी / Amount in words (automatic)",
      optional: true,
    },
    {
      name: "paidBy",
      label: "बुझाउनेको नाम / Payer name",
    },
    {
      name: "receivedBy",
      label: "बुझ्नेको नाम / Receiver name",
    },
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving.current) return;

    const data = new FormData(event.currentTarget);

    const value = (name: string) => String(data.get(name) ?? "").trim();

    const input: VoucherInput = {
      dateBs: value("dateBs"),
      personName: value("personName"),
      address: value("address"),
      receivedThrough: value("receivedThrough"),
      municipality: value("municipality"),
      ward: value("ward"),
      tole: value("tole"),
      purpose: value("purpose"),
      dayName: value("dayName"),

      paymentMethod: method,
      chequeNo: method === "CHEQUE" ? value("chequeNo") : "",

      amount: value("amount"),
      amountWords: amountInWords(value("amount")),
      paidBy: value("paidBy"),
      receivedBy: value("receivedBy"),
    };

    if (!input.amountWords) {
      setError(
        "Enter a positive amount without commas, with at most two decimal places (for example, 1250.50).",
      );
      return;
    }

    saving.current = true;
    setPending(true);
    setError("");

    try {
      if (record) {
        const updated = await updateVoucher(kind, record, input);

        onSaved(updated);
        return;
      }

      const body = JSON.stringify(input);

      if (!attempt.current || attempt.current.body !== body) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));

        attempt.current = {
          id: Array.from(bytes, (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join(""),
          body,
        };
      }

      const saved = await saveVoucher(kind, input, attempt.current.id);

      onSaved(saved);
    } catch (failure) {
      setError(message(failure));
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-line bg-white p-5 sm:p-6"
    >
      <h2 className="text-lg font-semibold">
        {record ? `Edit #${String(record.number).padStart(5, "0")}` : "New"}{" "}
        {kind === "rasid" ? "Rasid" : "Bharpai"}
      </h2>

      <p className="mt-1 mb-5 text-sm text-muted">
        Amount in words is filled automatically.{" "}
        {record
          ? "The original number will stay the same."
          : "The number is assigned when saved."}
      </p>

      {error && (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      )}

      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="block text-sm font-medium">
            {field.label}
            {!field.optional && " *"}

            {field.name === "amountWords" ? (
              <input
                name="amountWords"
                value={words}
                readOnly
                // rows={3}
                aria-live="polite"
                placeholder="रकम लेखेपछि अक्षरूपी आफैँ देखिन्छ"
                className={`${inputClass} resize-none bg-emerald-50 text-emerald-900`}
              />
            ) : (
              <input
                name={field.name}
                required={!field.optional}
                maxLength={field.max ?? 80}
                value={field.name === "amount" ? amount : undefined}
                defaultValue={
                  field.name === "amount" ? undefined : record?.[field.name]
                }
                onChange={
                  field.name === "amount"
                    ? (event) => setAmount(event.target.value)
                    : undefined
                }
                inputMode={field.name === "amount" ? "decimal" : "text"}
                placeholder={field.name === "dateBs" ? "2083/07/24" : undefined}
                className={inputClass}
              />
            )}
          </label>
        ))}

        <label className="block text-sm font-medium">
          Payment method *
          <select
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as "CASH" | "CHEQUE")
            }
            className={inputClass}
          >
            <option value="CASH">नगद / Cash</option>
            <option value="CHEQUE">चेक / Cheque</option>
          </select>
        </label>

        {method === "CHEQUE" && (
          <label className="block text-sm font-medium">
            Cheque number *
            <input
              name="chequeNo"
              required
              maxLength={50}
              defaultValue={record?.chequeNo}
              className={inputClass}
            />
          </label>
        )}
      </fieldset>

      <p className="mt-5 text-sm text-muted">
        Check the details before saving. Saved records can be reopened and
        printed.
      </p>

      <div className="mt-5 flex gap-3">
        <Button type="submit" pending={pending}>
          {record ? "Save changes" : "Save and open print view"}
        </Button>

        <Button variant="secondary" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function VoucherWorkspace({ kind }: { kind: VoucherKind }) {
  const [view, setView] = useState<"list" | "new" | "edit" | "saved">("list");

  const [selected, setSelected] = useState<Voucher | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);

  const [items, setItems] = useState<Voucher[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const openRequest = useRef<AbortController | null>(null);

  const title = kind === "rasid" ? "Rasid" : "Bharpai";

  useEffect(() => {
    return () => {
      openRequest.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (view !== "list") return;

    const controller = new AbortController();

    setLoading(true);
    setError("");

    getVouchers(kind, page, search, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setItems(result.items);
          setHasMore(result.hasMore);
        }
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) {
          setError(message(failure));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [kind, page, search, view, reload]);

  function back() {
    setSelected(null);
    setActionError("");
    setView("list");
  }

  async function openRecord(record: Voucher, mode: "saved" | "edit") {
    if (openRequest.current) return;

    const controller = new AbortController();
    openRequest.current = controller;

    setOpening(true);
    setActionError("");

    try {
      const fresh = await getVoucher(kind, record._id, controller.signal);

      if (!controller.signal.aborted) {
        setSelected(fresh);
        setView(mode);
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setActionError(message(failure));
      }
    } finally {
      openRequest.current = null;

      if (!controller.signal.aborted) {
        setOpening(false);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-ink">{title}</h1>

          <p className="mt-2 text-sm text-muted">
            {kind === "rasid" ? "नगदी रसीद" : "नगदी भरपाई"} · Saved and numbered
            records
          </p>
        </div>

        {view === "list" && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={opening || loading}
              onClick={() => {
                setActionError("");
                setReload((n) => n + 1);
              }}
            >
              Refresh
            </Button>

            <Button
              disabled={opening}
              onClick={() => {
                setSelected(null);
                setActionError("");
                setView("new");
              }}
            >
              New {title}
            </Button>
          </div>
        )}

        {view === "saved" && selected && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={opening}
              onClick={() => void openRecord(selected, "edit")}
            >
              Edit
            </Button>

            <Button
              variant="danger"
              disabled={opening}
              onClick={() => setDeleteTarget(selected)}
            >
              Delete
            </Button>

            <Button variant="secondary" disabled={opening} onClick={back}>
              Back to records
            </Button>
          </div>
        )}
      </div>

      {actionError && <Notice>{actionError}</Notice>}

      {opening && (
        <p role="status" className="text-sm text-muted">
          Opening record…
        </p>
      )}

      {(view === "new" || view === "edit") && (
        <VoucherForm
          key={
            view === "edit" && selected
              ? `${selected._id}-${selected.updatedAt}`
              : "new"
          }
          kind={kind}
          record={view === "edit" ? (selected ?? undefined) : undefined}
          onCancel={back}
          onSaved={(record) => {
            setSelected(record);
            setView("saved");
          }}
        />
      )}

      {view === "saved" && selected && (
        <VoucherPrint kind={kind} record={selected} />
      )}

      {view === "list" && (
        <div className="rounded-xl border border-line bg-white p-4 sm:p-6">
          <form
            className="mb-5 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(query.trim());
              setReload((n) => n + 1);
            }}
          >
            <input
              aria-label="Search by number or name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search number or name"
              maxLength={80}
              className={inputClass}
            />

            <Button type="submit" variant="secondary" disabled={opening}>
              Search
            </Button>
          </form>

          {loading ? (
            <p role="status" className="py-10 text-center text-muted">
              Loading records…
            </p>
          ) : error ? (
            <div className="space-y-3">
              <Notice>{error}</Notice>

              <Button
                variant="secondary"
                onClick={() => setReload((n) => n + 1)}
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas text-muted">
                    <tr>
                      {[
                        "Number",
                        "BS date",
                        "Name",
                        "Amount (NPR)",
                        "Actions",
                      ].map((label) => (
                        <th key={label} className="px-3 py-3 font-medium">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((record) => (
                      <tr key={record._id} className="border-t border-line">
                        <td className="px-3 py-4 font-semibold">
                          {String(record.number).padStart(5, "0")}
                        </td>

                        <td className="whitespace-nowrap px-3 py-4">
                          {record.dateBs}
                        </td>

                        <td className="px-3 py-4">{record.personName}</td>

                        <td className="whitespace-nowrap px-3 py-4">
                          {(record.amountPaisa / 100).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              disabled={opening}
                              onClick={() => void openRecord(record, "saved")}
                            >
                              View / Print
                            </Button>

                            <Button
                              variant="secondary"
                              disabled={opening}
                              onClick={() => void openRecord(record, "edit")}
                            >
                              Edit
                            </Button>

                            <Button
                              variant="danger"
                              disabled={opening}
                              onClick={() => setDeleteTarget(record)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {items.length === 0 && (
                <p className="py-10 text-center text-muted">
                  No records found.
                </p>
              )}

              <div className="mt-5 flex items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  disabled={page === 1 || opening}
                  onClick={() => setPage((n) => n - 1)}
                >
                  Previous
                </Button>

                <span className="text-sm text-muted">Page {page}</span>

                <Button
                  variant="secondary"
                  disabled={!hasMore || opening}
                  onClick={() => setPage((n) => n + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDelete
          name={`${title} #${String(deleteTarget.number).padStart(5, "0")}`}
          description="This permanently deletes the saved record. It cannot be undone. Its number will not be reused."
          onClose={() => setDeleteTarget(null)}
          onDelete={() => deleteVoucher(kind, deleteTarget)}
          onDone={() => {
            setDeleteTarget(null);
            back();
            setPage(1);
            setReload((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}

export function VoucherPage({ kind }: { kind: VoucherKind }) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <p>Checking your session…</p>;
  }

  if (status !== "authenticated" || !canUseVouchers(user)) {
    return <Notice>You do not have access to this page.</Notice>;
  }

  return <VoucherWorkspace key={`${kind}-${user!._id}`} kind={kind} />;
}
