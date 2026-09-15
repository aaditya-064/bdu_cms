import mongoose from 'mongoose';

const expenseRecordSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    amount: { type: Number, default: 0 },
    paymentMethod: { type: String, trim: true },
    vendor: { type: String, trim: true },
    receiptNo: { type: String, trim: true },
    notes: { type: String, trim: true },
    importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sourceFile: { type: String },
    batchId: { type: String },
  },
  { timestamps: true }
);

expenseRecordSchema.index({ date: 1 });
expenseRecordSchema.index({ category: 1 });
expenseRecordSchema.index({ batchId: 1 });

export const ExpenseRecord = mongoose.model('ExpenseRecord', expenseRecordSchema);
