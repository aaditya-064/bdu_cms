import mongoose from 'mongoose';

const vaultRecordSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    username: { type: String, trim: true, default: '' },
    encryptedPassword: { type: String, required: true },
    url: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastAccessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastAccessedAt: { type: Date },
  },
  { timestamps: true }
);

vaultRecordSchema.index({ category: 1 });
vaultRecordSchema.index({ createdBy: 1 });

export const VaultRecord = mongoose.model('VaultRecord', vaultRecordSchema);
