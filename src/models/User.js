import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      select: false,
      default: undefined,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
