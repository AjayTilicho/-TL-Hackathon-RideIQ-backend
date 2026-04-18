import mongoose from 'mongoose';

const petrolBunkSchema = new mongoose.Schema(
  {
    /** Stable client id, e.g. b1 or uuid for user-created */
    externalId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    rank: { type: Number, required: true, default: 999 },
    isSeed: { type: Boolean, default: false },
    city: { type: String, trim: true, default: 'Hyderabad' },
    /** Shown when there are no user ratings yet */
    seedDefaultStars: { type: Number, default: null },
  },
  { timestamps: true },
);

petrolBunkSchema.index({ rank: 1 });

export const PetrolBunk = mongoose.model('PetrolBunk', petrolBunkSchema);
