"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

import type { Voucher, VoucherKind } from "@/types/voucher.types";

const COMPANY = {
  name: "बुद्ध दाना उद्योग प्रा.लि.",
  address: "सियारी गा.पा.–५, बनघुसरी (छपिया), रुपन्देही",
  phone: "",
};

const printCss = `
  .voucher-paper,
  .voucher-paper * {
    box-sizing: border-box;
  }

  .voucher-paper {
    width: 1000px;
    padding: 28px 32px;
    background: white;
    color: #111;
    font: 19px/1.9 "Nirmala UI",
      "Noto Sans Devanagari", Mangal, sans-serif;
    border: 2px solid #222;
    overflow-wrap: anywhere;
  }

  .voucher-paper h1,
  .voucher-paper h2,
  .voucher-paper p {
    margin: 0;
  }

  .voucher-paper h1 {
    font-size: 38px;
    line-height: 1.5;
    font-weight: 800;
  }

  .voucher-paper h2 {
    font-size: 30px;
    font-weight: 800;
    text-decoration: underline;
  }

  .voucher-paper .center {
    text-align: center;
  }

  .voucher-paper .topline {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
  }

  .voucher-paper .receipt-title {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    align-items: center;
    gap: 12px;
    margin: 18px 0;
  }

  .voucher-paper .line {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 17px;
  }

  .voucher-paper .fill {
    flex: 1;
    min-width: 70px;
    border-bottom: 1px dotted #555;
    color: #111;
    padding: 0 6px;
  }

  .voucher-paper .short {
    flex: 0 1 90px;
  }

  .voucher-paper .wide {
    min-width: 220px;
  }

  .voucher-paper .signatures {
    display: flex;
    gap: 35px;
    margin-top: 28px;
    justify-content: space-between;
  }

  .voucher-paper .signature {
    flex: 1;
  }

  .voucher-paper .signature-space {
    margin-top: 34px;
    border-bottom: 1px dotted #777;
  }

  .voucher-paper .amount {
    border: 2px solid currentColor;
    align-self: center;
    padding: 8px 16px;
    font-size: 24px;
    font-weight: 700;
  }

  .voucher-paper.rasid {
    color: #285472;
    border-color: #b83929;
    border-radius: 18px;
  }

  .voucher-paper.rasid h1,
  .voucher-paper.rasid h2,
  .voucher-paper.rasid footer {
    color: #b83929;
  }

  .voucher-paper footer {
    text-align: center;
    margin-top: 24px;
    font-weight: 700;
  }

  .voucher-paper.bharpai {
    padding: 32px 38px;
  }

  .voucher-paper.bharpai .line {
    margin-top: 23px;
  }

  @media print {
    @page {
      size: A4 landscape;
      margin: 10mm;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: white;
    }

    .voucher-paper {
      width: 100%;
      break-inside: avoid;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
`;

function Fill({
  children,
  short = false,
}: {
  children?: ReactNode;
  short?: boolean;
}) {
  return (
    <span className={`fill${short ? " short" : ""}`}>
      {children || "\u00a0"}
    </span>
  );
}

export function VoucherPrint({
  kind,
  record,
}: {
  kind: VoucherKind;
  record: Voucher;
}) {
  const paper = useRef<HTMLDivElement>(null);

  const frame = useRef<HTMLIFrameElement | null>(null);

  const [printing, setPrinting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      frame.current?.remove();
    };
  }, []);

  function print() {
    if (!paper.current || printing) return;

    setPrinting(true);
    setError("");

    frame.current?.remove();

    const iframe = document.createElement("iframe");

    frame.current = iframe;

    iframe.title = "Receipt print";

    iframe.style.cssText =
      "position:fixed;width:1px;height:1px;" + "left:-10000px;top:0;border:0;";

    iframe.onload = async () => {
      try {
        const win = iframe.contentWindow;

        if (!win) {
          throw new Error("Print view could not open.");
        }

        await win.document.fonts.ready;

        win.onafterprint = () => {
          iframe.remove();
        };

        win.focus();
        win.print();
      } catch {
        setError("Printing could not start. Please try again.");

        iframe.remove();
      } finally {
        setPrinting(false);
      }
    };

    // React has already escaped entered text.
    iframe.srcdoc = `
      <!doctype html>
      <html lang="ne">
        <head>
          <meta charset="UTF-8">
          <title>${kind}-${record.number}</title>
        </head>
        <body>${paper.current.innerHTML}</body>
      </html>
    `;

    document.body.appendChild(iframe);
  }

  const number = String(record.number).padStart(5, "0");

  const amount = (record.amountPaisa / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const [year, month, day] = record.dateBs.split("/");

  const payment =
    record.paymentMethod === "CASH" ? "नगद" : `चेक नं. ${record.chequeNo}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={print} pending={printing}>
          Print {kind === "rasid" ? "Rasid" : "Bharpai"}
        </Button>

        <p className="text-sm text-muted">A4 landscape · Sign after printing</p>
      </div>

      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-3">
        <div ref={paper}>
          <style>{printCss}</style>

          <article className={`voucher-paper ${kind}`} lang="ne">
            {kind === "rasid" ? (
              <>
                {COMPANY.phone && (
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: 16,
                    }}
                  >
                    फोन नं. {COMPANY.phone}
                  </div>
                )}

                <header className="center">
                  <h1>{COMPANY.name}</h1>
                  <p>{COMPANY.address}</p>
                </header>

                <div className="receipt-title">
                  <span>रसीद नं. {number}</span>

                  <h2 className="center">नगदी रसीद</h2>

                  <span
                    style={{
                      textAlign: "right",
                    }}
                  >
                    मिति {record.dateBs}
                  </span>
                </div>

                <div className="line">
                  <span>श्री</span>
                  <Fill>{record.personName}</Fill>

                  <span>हस्ते</span>
                  <Fill>{record.receivedThrough}</Fill>
                </div>

                <div className="line">
                  <span>स्थान</span>
                  <Fill>{record.address}</Fill>

                  <span>बाट खातामध्ये बाँकी</span>

                  <Fill>{payment}</Fill>
                </div>

                <div className="line">
                  <span>अक्षरूपी</span>
                  <Fill>{record.amountWords}</Fill>
                  <span>प्राप्त भयो ।</span>
                </div>

                <div className="signatures">
                  <div className="amount">रु. {amount}</div>

                  <div className="signature">
                    बुझाउनेको नाम
                    <p>{record.paidBy}</p>
                    <div className="signature-space" />
                    सही
                  </div>

                  <div className="signature">
                    बुझ्नेको नाम
                    <p>{record.receivedBy}</p>
                    <div className="signature-space" />
                    सही
                  </div>
                </div>

                <footer>कृपया यो रसीद सुरक्षित राख्नुहोला</footer>
              </>
            ) : (
              <>
                <div className="topline">
                  <span>भरपाई नं. {number}</span>

                  <span>मिति: {record.dateBs}</span>
                </div>

                <h2 className="center">नगदी भरपाई</h2>

                <p
                  className="center"
                  style={{
                    marginTop: 22,
                    fontWeight: 700,
                  }}
                >
                  भरपाई दादै {COMPANY.name} {COMPANY.address} बाट
                </p>

                <div className="line">
                  <span>गा.पा./न.पा.</span>
                  <Fill>{record.municipality}</Fill>

                  <span>वडा नं.</span>
                  <Fill short>{record.ward}</Fill>

                  <span>टोल</span>
                  <Fill>{record.tole}</Fill>
                </div>

                <div className="line">
                  <span>बस्ने</span>
                  <Fill>{record.personName}</Fill>
                  <span>ले</span>
                </div>

                <div className="line">
                  <Fill>{record.purpose}</Fill>

                  <span>वापत</span>
                  <Fill>{payment}</Fill>
                  <span>बाट</span>
                </div>

                <div className="line">
                  <span>रु.</span>
                  <Fill>{amount}</Fill>

                  <span>अक्षरूपी</span>
                  <Fill>{record.amountWords}</Fill>
                </div>

                <p
                  style={{
                    marginTop: 20,
                  }}
                >
                  बुझिलिई भरपाई गरिदियाँ ।
                </p>

                <div className="line">
                  <span>इति सम्वत्</span>
                  <Fill short>{year}</Fill>

                  <span>साल</span>
                  <Fill short>{month}</Fill>

                  <span>महिना</span>
                  <Fill short>{day}</Fill>

                  <span>गते रोज</span>
                  <Fill>{record.dayName}</Fill>

                  <span>शुभम् ।</span>
                </div>

                <div className="signatures">
                  <div className="signature">
                    बुझाउनेको दस्तखत :<p>{record.paidBy}</p>
                    <div className="signature-space" />
                  </div>

                  <div className="signature">
                    बुझिलिनेको दस्तखत :<p>{record.receivedBy}</p>
                    <div className="signature-space" />
                  </div>
                </div>
              </>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
