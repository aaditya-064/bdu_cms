// Print only the selected quantity table, isolated from the ERP and P/L CSS.
export async function printWorkerSheet(source: HTMLElement, title: string) {
  const sheet = source.querySelector<HTMLElement>(".batch-paper");
  if (!sheet) throw new Error("Open a worker batch sheet before printing.");

  document.getElementById("worker-print-frame")?.remove();
  const frame = document.createElement("iframe");
  frame.id = "worker-print-frame";
  frame.title = "Worker batch print";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    throw new Error("Your browser could not open the print view.");
  }

  try {
    doc.open();
    doc.write("<!doctype html><html><head></head><body></body></html>");
    doc.close();
    doc.title = title;
    doc.documentElement.lang = "en";
    const style = doc.createElement("style");
    style.textContent = `
      @page { size: A4 portrait; margin: 8mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: white; color: black; }
      body { font: 11px/1.2 Arial, sans-serif; }
      #print-page { width: 194mm; height: 280mm; overflow: hidden; }
      .batch-paper { width: 194mm; margin: 0; transform-origin: top left; }
      .sheet-band { background: #00b0df; padding: 4px 6px; font-size: 12px; }
      .sheet-band span { float: right; }
      .excel-sheet { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #202020; padding: 4px 3px; overflow-wrap: anywhere; vertical-align: middle; }
      th { text-align: left; }
      td { text-align: right; font-variant-numeric: tabular-nums; }
      .sheet-name { text-align: left; color: #e00000; font-weight: bold; }
      .sheet-reference { color: red; }
      .batch-number { font-size: 13px; font-weight: bold; }
      .sheet-green { background: #00b050; }
      .sheet-lime { background: #92d050; }
      .sheet-cyan { background: #00b0df; }
      * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    `;
    doc.head.appendChild(style);
    const page = doc.createElement("div");
    page.id = "print-page";
    const paper = doc.importNode(sheet, true) as HTMLElement;
    page.appendChild(paper);
    doc.body.appendChild(page);

    // The fixed page is slightly shorter than the available 281mm to avoid
    // printer rounding producing a blank second page. Never drop any rows.
    const fit = () => {
      paper.style.transform = "none";
      const scale = Math.min(
        1,
        (page.clientWidth - 2) / paper.scrollWidth,
        (page.clientHeight - 2) / paper.scrollHeight,
      );
      paper.style.transform = `scale(${scale})`;
    };
    await doc.fonts.ready;
    // Read layout synchronously so off-screen iframe animation throttling
    // cannot prevent the print dialog from opening.
    fit();
    win.onbeforeprint = fit;
    win.onafterprint = () => window.setTimeout(() => frame.remove(), 0);
    win.focus();
    win.print();
    // Keep the frame until afterprint. Removing it immediately can cancel
    // non-blocking print dialogs. A later print also replaces any old frame.
  } catch (error) {
    frame.remove();
    throw error;
  }
}
