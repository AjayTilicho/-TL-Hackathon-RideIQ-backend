import mongoose from 'mongoose';

const bunkCommentSchema = new mongoose.Schema(
  {
    bunkId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetrolBunk', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

bunkCommentSchema.index({ bunkId: 1, createdAt: -1 });

export const BunkComment = mongoose.model('BunkComment', bunkCommentSchema);
