import mongoose from 'mongoose';

const bunkRatingSchema = new mongoose.Schema(
  {
    bunkId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetrolBunk', required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
);

bunkRatingSchema.index({ bunkId: 1, createdAt: -1 });

export const BunkRating = mongoose.model('BunkRating', bunkRatingSchema);
