import mongoose from 'mongoose';

const bikeSchema = new mongoose.Schema(
  {
    brand: { type: String, trim: true, required: true },
    model: { type: String, trim: true, required: true },
    year: { type: String, trim: true, required: true },
    registrationNumber: { type: String, trim: true, required: true },
    fuelType: { type: String, trim: true, required: true },
    engineCc: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    claimedMileageKmL: { type: Number, default: null },
    fuelSystem: { type: String, trim: true, default: 'Fuel Injected' },
    /** Base64 or data URL — optional bike photo */
    image: { type: String, default: '' },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

bikeSchema.index({ userId: 1, registrationNumber: 1 });

export const Bike = mongoose.model('Bike', bikeSchema);
