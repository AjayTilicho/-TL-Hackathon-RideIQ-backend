import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    bikeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bike',
      required: true,
      index: true,
    },
    /** Original file name */
    name: { type: String, trim: true, default: 'Document' },
    mimeType: { type: String, trim: true, default: '' },
    /** license | rc | insurance | puc | other */
    category: { type: String, trim: true, default: 'other' },
    /** Human-readable label (RC, Insurance, …) */
    type: {
      type: String,
      trim: true,
      required: true,
    },
    documentNumber: { type: String, trim: true, default: '' },
    expiryDate: { type: Date, default: null },
    /** Base64 data URL or raw base64 payload */
    image: { type: String, required: true },
    /** AI / OCR / client extraction payload */
    extractedData: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', documentSchema);
