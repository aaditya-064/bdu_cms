import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import { SaleRecord } from '../models/SaleRecord.js';
import { PurchaseRecord } from '../models/PurchaseRecord.js';
import { ExpenseRecord } from '../models/ExpenseRecord.js';

interface ImportResult {
  totalRows: number;
  imported: number;
  duplicates: number;
  invalid: number;
  errors: string[];
  qualityScore: number;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findColumn(headers: string[], candidates: string[]): string | null {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(normalizeHeader(candidate));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Excel serial date
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  const str = String(value).trim();
  if (!str) return null;
  // Try common formats
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    let [a, b, c] = parts;
    let year: number, month: number, day: number;
    if (a.length === 4) {
      year = parseInt(a); month = parseInt(b); day = parseInt(c);
    } else if (c.length === 4) {
      year = parseInt(c);
      // DD/MM/YYYY or MM/DD/YYYY - assume DD/MM/YYYY
      day = parseInt(a); month = parseInt(b);
    } else {
      return null;
    }
    if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace(/[^0-9.\-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseRecordsFromData(data: Record<string, unknown>[], type: 'sales' | 'purchases' | 'expenses', userId: string, batchId: string, sourceFile: string): { records: unknown[]; invalid: number; errors: string[] } {
  const records: unknown[] = [];
  let invalid = 0;
  const errors: string[] = [];

  if (data.length === 0) {
    return { records, invalid, errors };
  }

  const headers = Object.keys(data[0]);

  if (type === 'sales') {
    const dateCol = findColumn(headers, ['date', 'sale date', 'invoice date']);
    const invoiceCol = findColumn(headers, ['invoice no', 'invoice number', 'bill no', 'invoice']);
    const customerCol = findColumn(headers, ['customer name', 'customer', 'client', 'buyer']);
    const productCol = findColumn(headers, ['product name', 'product', 'item name', 'item']);
    const categoryCol = findColumn(headers, ['category', 'product category', 'item category']);
    const qtyCol = findColumn(headers, ['quantity', 'qty', 'count']);
    const priceCol = findColumn(headers, ['unit price', 'price', 'rate', 'unit cost']);
    const totalCol = findColumn(headers, ['total amount', 'total', 'amount', 'sale amount']);
    const costCol = findColumn(headers, ['cost price', 'cost', 'purchase price']);
    const paymentCol = findColumn(headers, ['payment method', 'payment', 'mode']);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const date = parseDate(row[dateCol || ''] ?? row[headers[0]]);
      if (!date) {
        invalid++;
        errors.push(`Row ${i + 2}: Invalid or missing date`);
        continue;
      }
      const qty = parseNumber(row[qtyCol || '']);
      const unitPrice = parseNumber(row[priceCol || '']);
      const totalAmount = parseNumber(row[totalCol || '']) || (qty * unitPrice);
      const costPrice = parseNumber(row[costCol || '']);

      records.push({
        date,
        invoiceNo: String(row[invoiceCol || ''] || '').trim(),
        customerName: String(row[customerCol || ''] || '').trim(),
        productName: String(row[productCol || ''] || '').trim(),
        category: String(row[categoryCol || ''] || '').trim(),
        quantity: qty,
        unitPrice,
        totalAmount,
        costPrice,
        profit: totalAmount - costPrice * qty,
        paymentMethod: String(row[paymentCol || ''] || '').trim(),
        importedBy: userId,
        sourceFile,
        batchId,
      });
    }
  } else if (type === 'purchases') {
    const dateCol = findColumn(headers, ['date', 'purchase date', 'bill date']);
    const billCol = findColumn(headers, ['bill no', 'bill number', 'invoice no', 'po number']);
    const supplierCol = findColumn(headers, ['supplier name', 'supplier', 'vendor']);
    const productCol = findColumn(headers, ['product name', 'product', 'item name', 'item']);
    const categoryCol = findColumn(headers, ['category', 'product category']);
    const qtyCol = findColumn(headers, ['quantity', 'qty', 'count']);
    const costCol = findColumn(headers, ['unit cost', 'cost', 'price', 'rate']);
    const totalCol = findColumn(headers, ['total amount', 'total', 'amount']);
    const paymentCol = findColumn(headers, ['payment method', 'payment', 'mode']);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const date = parseDate(row[dateCol || ''] ?? row[headers[0]]);
      if (!date) {
        invalid++;
        errors.push(`Row ${i + 2}: Invalid or missing date`);
        continue;
      }
      const qty = parseNumber(row[qtyCol || '']);
      const unitCost = parseNumber(row[costCol || '']);
      const totalAmount = parseNumber(row[totalCol || '']) || (qty * unitCost);

      records.push({
        date,
        billNo: String(row[billCol || ''] || '').trim(),
        supplierName: String(row[supplierCol || ''] || '').trim(),
        productName: String(row[productCol || ''] || '').trim(),
        category: String(row[categoryCol || ''] || '').trim(),
        quantity: qty,
        unitCost,
        totalAmount,
        paymentMethod: String(row[paymentCol || ''] || '').trim(),
        importedBy: userId,
        sourceFile,
        batchId,
      });
    }
  } else {
    const dateCol = findColumn(headers, ['date', 'expense date']);
    const categoryCol = findColumn(headers, ['category', 'expense category', 'type']);
    const descCol = findColumn(headers, ['description', 'desc', 'details', 'purpose']);
    const amountCol = findColumn(headers, ['amount', 'expense amount', 'total']);
    const vendorCol = findColumn(headers, ['vendor', 'payee', 'paid to']);
    const paymentCol = findColumn(headers, ['payment method', 'payment', 'mode']);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const date = parseDate(row[dateCol || ''] ?? row[headers[0]]);
      if (!date) {
        invalid++;
        errors.push(`Row ${i + 2}: Invalid or missing date`);
        continue;
      }
      const amount = parseNumber(row[amountCol || '']);

      records.push({
        date,
        category: String(row[categoryCol || ''] || '').trim(),
        description: String(row[descCol || ''] || '').trim(),
        amount,
        vendor: String(row[vendorCol || ''] || '').trim(),
        paymentMethod: String(row[paymentCol || ''] || '').trim(),
        importedBy: userId,
        sourceFile,
        batchId,
      });
    }
  }

  return { records, invalid, errors };
}

function detectDuplicatesSales(records: Record<string, unknown>[]): { unique: Record<string, unknown>[]; duplicates: number } {
  const seen = new Set<string>();
  const unique: Record<string, unknown>[] = [];
  let duplicates = 0;

  for (const record of records) {
    const key = [
      record.date ? new Date(record.date as string).toISOString().split('T')[0] : '',
      record.invoiceNo || '',
      record.customerName || '',
      record.productName || '',
      record.totalAmount || '',
    ].join('|');

    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
      unique.push(record);
    }
  }

  return { unique, duplicates };
}

function detectDuplicatesPurchases(records: Record<string, unknown>[]): { unique: Record<string, unknown>[]; duplicates: number } {
  const seen = new Set<string>();
  const unique: Record<string, unknown>[] = [];
  let duplicates = 0;

  for (const record of records) {
    const key = [
      record.date ? new Date(record.date as string).toISOString().split('T')[0] : '',
      record.billNo || '',
      record.supplierName || '',
      record.productName || '',
      record.totalAmount || '',
    ].join('|');

    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
      unique.push(record);
    }
  }

  return { unique, duplicates };
}

function detectDuplicatesExpenses(records: Record<string, unknown>[]): { unique: Record<string, unknown>[]; duplicates: number } {
  const seen = new Set<string>();
  const unique: Record<string, unknown>[] = [];
  let duplicates = 0;

  for (const record of records) {
    const key = [
      record.date ? new Date(record.date as string).toISOString().split('T')[0] : '',
      record.category || '',
      record.description || '',
      record.amount || '',
    ].join('|');

    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
      unique.push(record);
    }
  }

  return { unique, duplicates };
}

export async function importData(
  buffer: Buffer,
  fileName: string,
  type: 'sales' | 'purchases' | 'expenses',
  userId: string
): Promise<ImportResult> {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let data: Record<string, unknown>[] = [];
  const errors: string[] = [];

  const ext = fileName.toLowerCase().split('.').pop();

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in the file');
    }
    const sheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[];
  } else if (ext === 'csv') {
    const content = buffer.toString('utf-8');
    data = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, unknown>[];
  } else if (ext === 'json') {
    const content = buffer.toString('utf-8');
    const parsed = JSON.parse(content);
    data = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }

  const totalRows = data.length;
  const { records, invalid, errors: parseErrors } = parseRecordsFromData(data, type, userId, batchId, fileName);
  errors.push(...parseErrors);

  let uniqueRecords: Record<string, unknown>[] = [];
  let duplicates = 0;

  if (type === 'sales') {
    const result = detectDuplicatesSales(records as Record<string, unknown>[]);
    uniqueRecords = result.unique;
    duplicates = result.duplicates;
    if (uniqueRecords.length > 0) {
      await SaleRecord.insertMany(uniqueRecords);
    }
  } else if (type === 'purchases') {
    const result = detectDuplicatesPurchases(records as Record<string, unknown>[]);
    uniqueRecords = result.unique;
    duplicates = result.duplicates;
    if (uniqueRecords.length > 0) {
      await PurchaseRecord.insertMany(uniqueRecords);
    }
  } else {
    const result = detectDuplicatesExpenses(records as Record<string, unknown>[]);
    uniqueRecords = result.unique;
    duplicates = result.duplicates;
    if (uniqueRecords.length > 0) {
      await ExpenseRecord.insertMany(uniqueRecords);
    }
  }

  const imported = uniqueRecords.length;
  const qualityScore = totalRows > 0 ? Math.round((imported / totalRows) * 100) : 0;

  return {
    totalRows,
    imported,
    duplicates,
    invalid,
    errors: errors.slice(0, 20), // Limit error messages
    qualityScore,
  };
}
