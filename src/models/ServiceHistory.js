import mongoose from 'mongoose';

const serviceHistorySchema = new mongoose.Schema(
  {
    bikeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bike',
      required: true,
      index: true,
    },
    serviceDate: { type: Date, required: true },
    title: { type: String, trim: true, required: true },
    notes: { type: String, trim: true, default: '' },
    cost: { type: Number, min: 0, default: 0 },
    odoKm: { type: Number, default: null },
    serviceCenter: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export const ServiceHistory = mongoose.model('ServiceHistory', serviceHistorySchema);
