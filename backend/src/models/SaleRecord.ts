import mongoose from 'mongoose';

const saleRecordSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    invoiceNo: { type: String, trim: true },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    productName: { type: String, trim: true },
    category: { type: String, trim: true },
    quantity: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    paymentMethod: { type: String, trim: true },
    notes: { type: String, trim: true },
    importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sourceFile: { type: String },
    batchId: { type: String },
  },
  { timestamps: true }
);

saleRecordSchema.index({ date: 1 });
saleRecordSchema.index({ customerName: 1 });
saleRecordSchema.index({ category: 1 });
saleRecordSchema.index({ batchId: 1 });

export const SaleRecord = mongoose.model('SaleRecord', saleRecordSchema);
