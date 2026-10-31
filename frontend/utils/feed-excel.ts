import type { WorkerSheet } from "@/types/feed.types";

export async function downloadBatchExcel(sheet: WorkerSheet, brand: string) {
  const { default: ExcelJS } = await import("exceljs");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Buddha Dana Udhyog";
  workbook.calcProperties.fullCalcOnLoad = true;

  const ws = workbook.addWorksheet("Batch sheet", {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    views: [{ state: "frozen", ySplit: 2 }],
  });

  ws.columns = [{ width: 38 }, { width: 19 }, { width: 19 }, { width: 19 }];

  const round = (value: number) => Number(value.toFixed(6));

  function colour(rowNumber: number, argb: string) {
    const row = ws.getRow(rowNumber);

    for (let c = 1; c <= 4; c++) {
      row.getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb },
      };

      row.getCell(c).font = {
        name: "Arial",
        size: 11,
        bold: true,
      };
    }
  }

  ws.addRow([`${brand.toUpperCase()} - ${sheet.code} - 800 kg batch sheet`]);

  ws.mergeCells("A1:D1");
  colour(1, "FF00B0DF");

  function addSection(title: string, items: { name: string; one: number }[]) {
    const header = ws.addRow([
      title,
      "For 1 Batch",
      "For 5 Batch",
      "For 10 Batch",
    ]);

    colour(header.number, "FF92D050");

    const first = header.number + 1;
    let total = 0;

    for (const item of items) {
      const one = round(item.one);
      total += one;

      const row = ws.addRow([item.name, one]);

      row.getCell(1).font = {
        name: "Arial",
        size: 11,
        color: { argb: "FFFF0000" },
      };

      row.getCell(3).value = {
        formula: `B${row.number}*5`,
        result: round(one * 5),
      };

      row.getCell(4).value = {
        formula: `B${row.number}*10`,
        result: round(one * 10),
      };
    }

    const last = ws.rowCount;
    const row = ws.addRow(["TOTAL"]);

    for (let c = 2; c <= 4; c++) {
      const column = String.fromCharCode(64 + c);

      row.getCell(c).value = items.length
        ? {
            formula: `SUM(${column}${first}:${column}${last})`,
            result: round(total * [1, 5, 10][c - 2]),
          }
        : 0;
    }

    colour(row.number, "FF00B050");

    return {
      row: row.number,
      total: round(total),
    };
  }

  // batchKg and one are already scaled to one batch by the backend.
  const ingredients = addSection(
    "Ingredients (kg)",
    sheet.ingredients.map((row) => ({
      name: row.name,
      one: row.batchKg,
    })),
  );

  const additives = addSection(
    "Additives (kg)",
    sheet.additives.map((row) => ({
      name: row.name,
      one: row.one,
    })),
  );

  const check = ws.addRow(["Additives per batch"]);

  for (let c = 2; c <= 4; c++) {
    const column = String.fromCharCode(64 + c);

    check.getCell(c).value = {
      formula: `${column}${additives.row}/${[1, 5, 10][c - 2]}`,
      result: additives.total,
    };
  }

  colour(check.number, "FF00B0DF");

  const grand = ws.addRow(["TOTAL FEED (kg)"]);

  for (let c = 2; c <= 4; c++) {
    const column = String.fromCharCode(64 + c);

    grand.getCell(c).value = {
      formula: `${column}${ingredients.row}+${column}${additives.row}`,
      result: round((ingredients.total + additives.total) * [1, 5, 10][c - 2]),
    };
  }

  colour(grand.number, "FF92D050");

  ws.eachRow((row) => {
    row.height = 24;

    for (let c = 1; c <= 4; c++) {
      const cell = row.getCell(c);

      cell.font = {
        name: "Arial",
        size: 11,
        ...cell.font,
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: c === 1 ? "left" : "right",
        wrapText: true,
      };

      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };

      if (c > 1) cell.numFmt = "#,##0.######";
    }

    if (String(row.getCell(1).value ?? "").length > 32) {
      row.height = 34;
    }
  });

  ws.pageSetup.printArea = `A1:D${ws.rowCount}`;
  ws.pageSetup.printTitlesRow = "1:2";

  const buffer = await workbook.xlsx.writeBuffer();

  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(new Uint8Array(buffer));

  const blob = new Blob([bytes.buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${brand}-${sheet.code}-batch-sheet.xlsx`.replace(
    /[\\/:*?"<>|]/g,
    "-",
  );

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
