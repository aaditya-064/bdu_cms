import mongoose from 'mongoose';

const fileRecordSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String, required: true },
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

fileRecordSchema.index({ folderId: 1 });
fileRecordSchema.index({ uploadedBy: 1 });

export const FileRecord = mongoose.model('FileRecord', fileRecordSchema);

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

folderSchema.index({ parentId: 1 });

export const Folder = mongoose.model('Folder', folderSchema);
