import mongoose from 'mongoose';

const purchaseRecordSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    billNo: { type: String, trim: true },
    supplierName: { type: String, trim: true },
    productName: { type: String, trim: true },
    category: { type: String, trim: true },
    quantity: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, trim: true },
    notes: { type: String, trim: true },
    importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sourceFile: { type: String },
    batchId: { type: String },
  },
  { timestamps: true }
);

purchaseRecordSchema.index({ date: 1 });
purchaseRecordSchema.index({ supplierName: 1 });
purchaseRecordSchema.index({ category: 1 });
purchaseRecordSchema.index({ batchId: 1 });

export const PurchaseRecord = mongoose.model('PurchaseRecord', purchaseRecordSchema);
