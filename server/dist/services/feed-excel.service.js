"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBatchWorkbook = buildBatchWorkbook;
exports.buildProfitWorkbook = buildProfitWorkbook;
const exceljs_1 = __importDefault(require("exceljs"));
const feed_service_1 = require("./feed.service");
async function buildBatchWorkbook(sheets, brand, publishedAt) {
    const workbook = new exceljs_1.default.Workbook();
    workbook.creator = "Buddha Dana Udhyog";
    workbook.calcProperties.fullCalcOnLoad = true;
    for (const sheet of sheets) {
        const ws = workbook.addWorksheet(sheet.code, {
            pageSetup: {
                paperSize: 9,
                orientation: "portrait",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
            },
            views: [{ state: "frozen", ySplit: 2 }],
        });
        ws.columns = [
            { width: 34 },
            { width: 15 },
            { width: 19 },
            { width: 19 },
            { width: 19 },
        ];
        function colour(row, argb) {
            for (let c = 1; c <= 5; c++)
                ws.getCell(row, c).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb },
                };
        }
        function formula(row, col, expression, result) {
            ws.getCell(row, col).value = { formula: expression, result };
        }
        ws.addRow([sheet.code, "", "", "", brand]);
        ws.mergeCells("A1:D1");
        colour(1, "FF00B0DF");
        ws.addRow([
            "Ingredients",
            `${sheet.code} (kg)`,
            `${sheet.code} 800 kg Batch`,
            "",
            brand,
        ]);
        ws.mergeCells("C2:D2");
        const ingredientStart = ws.rowCount + 1;
        for (const item of sheet.ingredients) {
            const row = ws.addRow([item.name, item.referenceKg]);
            formula(row.number, 3, `B${row.number}*0.8`, item.referenceKg * 0.8);
        }
        const ingredientEnd = ws.rowCount;
        const ingredientTotal = ws.addRow(["Total"]).number;
        for (const [col, cached] of [
            [2, sheet.ingredientReference],
            [3, sheet.ingredientTotal],
        ]) {
            const letter = String.fromCharCode(64 + col);
            formula(ingredientTotal, col, ingredientEnd >= ingredientStart
                ? `SUM(${letter}${ingredientStart}:${letter}${ingredientEnd})`
                : "0", cached);
        }
        colour(ingredientTotal, "FF00B050");
        const header = ws.addRow([
            "Additives",
            `${sheet.code} (kg)`,
            "For 1 Batch",
            "For 5 Batch",
            "For 10 Batch",
        ]);
        colour(header.number, "FF92D050");
        const additiveStart = ws.rowCount + 1;
        for (const item of sheet.additives) {
            const row = ws.addRow([item.name, item.referenceKg]);
            formula(row.number, 3, `B${row.number}*0.8`, item.referenceKg * 0.8);
            formula(row.number, 4, `C${row.number}*5`, item.referenceKg * 4);
            formula(row.number, 5, `C${row.number}*10`, item.referenceKg * 8);
        }
        const additiveEnd = ws.rowCount;
        const additiveTotal = ws.addRow(["TOTAL"]).number;
        [
            sheet.additiveReference,
            sheet.additiveOne,
            sheet.additiveFive,
            sheet.additiveTen,
        ].forEach((total, i) => {
            const letter = String.fromCharCode(66 + i);
            formula(additiveTotal, i + 2, additiveEnd >= additiveStart
                ? `SUM(${letter}${additiveStart}:${letter}${additiveEnd})`
                : "0", total);
        });
        colour(additiveTotal, "FF00B050");
        const average = ws.addRow(["Average additives / batch (kg)"]).number;
        [1, 5, 10].forEach((count, i) => {
            const letter = String.fromCharCode(67 + i);
            formula(average, i + 3, `${letter}${additiveTotal}/${count}`, sheet.additiveOne);
        });
        colour(average, "FF00B0DF");
        const full = ws.addRow(["Full feed (kg)"]).number;
        formula(full, 2, `B${ingredientTotal}+B${additiveTotal}`, sheet.referenceKg);
        formula(full, 3, `C${ingredientTotal}+C${additiveTotal}`, sheet.fullBatchKg);
        ws.mergeCells(full, 4, full, 5);
        ws.getCell(full, 4).value = publishedAt
            ? new Date(publishedAt).toLocaleDateString("en-GB")
            : "";
        ws.eachRow((row) => {
            row.height = 22;
            for (let col = 1; col <= 5; col++) {
                const cell = row.getCell(col);
                cell.font = {
                    name: "Arial",
                    size: 11,
                    bold: col >= 3,
                    color: { argb: col <= 2 ? "FFFF0000" : "FF000000" },
                };
                cell.alignment = {
                    vertical: "middle",
                    horizontal: col === 1 ? "left" : "right",
                    wrapText: true,
                };
                cell.border = {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" },
                };
                if (col >= 2)
                    cell.numFmt = "0.000";
            }
            if (String(row.getCell(1).value ?? "").length > 28)
                row.height = 32;
        });
        for (const r of [ingredientTotal, additiveTotal, average, full]) {
            for (let col = 2; col <= 5; col++)
                ws.getCell(r, col).numFmt = "0.00";
        }
        ws.getRow(2).height = 32;
        ws.getRow(header.number).height = 32;
        ws.pageSetup.printArea = `A1:E${ws.rowCount}`;
        ws.pageSetup.printTitlesRow = "1:2";
    }
    return workbook;
}
async function buildProfitWorkbook(sheets, brand, publishedAt) {
    const workbook = new exceljs_1.default.Workbook();
    workbook.creator = "Buddha Dana Udhyog";
    for (const saved of sheets) {
        const sheet = (0, feed_service_1.formatProfitSheet)(saved);
        const ws = workbook.addWorksheet(sheet.code, {
            pageSetup: {
                paperSize: 9,
                orientation: "landscape",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 1,
            },
        });
        // A–D: additives. E–H: ingredients. I–J: P/L analysis.
        ws.columns = [
            { width: 30 },
            { width: 12 },
            { width: 12 },
            { width: 16 },
            { width: 28 },
            { width: 12 },
            { width: 12 },
            { width: 16 },
            { width: 34 },
            { width: 19 },
        ];
        function put(row, column, value, background = "FFFFFF", colour = "000000", bold = false) {
            const cell = ws.getCell(row, column);
            cell.value = value;
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: `FF${background}` },
            };
            cell.font = {
                name: "Arial",
                size: 11,
                bold,
                color: { argb: `FF${colour}` },
            };
            cell.alignment = {
                vertical: "middle",
                horizontal: typeof value === "number" ? "right" : "left",
                wrapText: true,
            };
            cell.border = {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
            };
            if (typeof value === "number") {
                cell.numFmt = "0.00##";
            }
            ws.getRow(row).height = 30;
        }
        for (let column = 1; column <= 10; column++) {
            put(1, column, sheet.code, "00B0DF");
        }
        ["Ingredients/ADDITIVES", "KG", "PRICE", "AMOUNT"].forEach((label, index) => {
            put(2, index + 1, label, "00B050", "000000", true);
        });
        ["Ingredients", "KG", "PRICE", "AMOUNT"].forEach((label, index) => {
            put(2, index + 5, label, "4F81BD", "FF0000", true);
        });
        put(2, 9, "P/L ANALYSIS", "4F81BD", "FF0000", true);
        put(2, 10, "", "4F81BD");
        ws.mergeCells("I2:J2");
        ws.getRow(2).height = 36;
        function writeGroup(rows, firstColumn, totalLabel, totalKg, totalAmount) {
            rows.forEach((row, index) => {
                const line = index + 3;
                put(line, firstColumn, row.name, "FFFFFF", "FF0000", true);
                put(line, firstColumn + 1, row.quantityKg, "FFFF00", "000000", true);
                put(line, firstColumn + 2, row.price, "8DB4E2");
                put(line, firstColumn + 3, row.amount, "E6B8B7");
                ws.getCell(line, firstColumn + 1).numFmt =
                    firstColumn === 1 ? "0.000" : "0.00";
            });
            const totalRow = rows.length + 3;
            put(totalRow, firstColumn, totalLabel, "C00000", "FFFFFF", true);
            put(totalRow, firstColumn + 1, totalKg, "C00000", "000000", true);
            // No sum of prices.
            put(totalRow, firstColumn + 2, "", "C00000");
            put(totalRow, firstColumn + 3, totalAmount, "C00000", "000000", true);
            return totalRow;
        }
        const additiveTotalRow = writeGroup(sheet.additives, 1, "Total (A)", sheet.additiveKg, sheet.additiveAmount);
        const ingredientTotalRow = writeGroup(sheet.ingredients, 5, "Total (B)", sheet.ingredientKg, sheet.ingredientAmount);
        const bagRow = ingredientTotalRow + 1;
        put(bagRow, 5, "Bags (C)", "C00000", "FFFFFF", true);
        put(bagRow, 6, `${sheet.inputs.bags} PCS`, "C00000");
        put(bagRow, 7, sheet.bagPrice, "C00000");
        put(bagRow, 8, sheet.bagAmount, "C00000");
        const totalRow = bagRow + 1;
        put(totalRow, 5, "Total (A+B+C)", "C00000", "FFFFFF", true);
        put(totalRow, 6, sheet.recipeKg, "C00000", "000000", true);
        put(totalRow, 7, "", "C00000");
        put(totalRow, 8, sheet.totalCost, "C00000", "000000", true);
        const analysis = [
            ["TOTAL COST OF RM", sheet.totalCost, "FFC000", "FFC000"],
            ["GOODS LOSS 2%", sheet.goodsLoss, "FF0000", "E87500"],
            ["UTILITY", sheet.inputs.utility, "FF0000", "E87500"],
            ["MANUFACTURE COST", sheet.inputs.labour, "FF0000", "E87500"],
            ["OVERHEAD COST", sheet.inputs.overhead, "FF0000", "E87500"],
            [
                "FIRE WOOD (STEAM SECTION)",
                sheet.inputs.firewood ?? 0,
                "FF0000",
                "E87500",
            ],
            ["FREIGHT", sheet.inputs.freight, "FF0000", "E87500"],
            ["COST OF GOODS SALES", sheet.costPerTon, "963634", "963634"],
            ["SALES PRICE/TON (GROSS)", sheet.inputs.pricePerTon, "7030A0", "000000"],
            ["COMMISSION", sheet.inputs.commission, "7030A0", "7030A0"],
            ["SALES PRICE/TON (NET)", sheet.salesPerTon, "963634", "963634"],
            ["COST OF GOODS SALES", sheet.costPerTon, "FFC000", "FFC000"],
            ["P/L PER TON", sheet.profitPerTon, "FF0000", "FF0000"],
        ];
        analysis.forEach(([label, value, labelColour, valueColour], index) => {
            const row = index + 3;
            const textColour = index === 12 ? "FFFF00" : index >= 8 ? "FFE080" : "002060";
            put(row, 9, label, labelColour, textColour, true);
            put(row, 10, value, valueColour, textColour, true);
        });
        const footerRow = Math.max(additiveTotalRow, totalRow, analysis.length + 2) + 1;
        for (let column = 1; column <= 10; column++) {
            put(footerRow, column, "", "00B0DF");
        }
        put(footerRow, 1, brand.toUpperCase(), "00B0DF", "000000", true);
        put(footerRow, 5, sheet.code, "00B0DF", "000000", true);
        put(footerRow, 9, publishedAt ? new Date(publishedAt).toLocaleDateString("en-GB") : "", "00B0DF");
        ws.pageSetup.printArea = `A1:J${footerRow}`;
    }
    return workbook;
}
