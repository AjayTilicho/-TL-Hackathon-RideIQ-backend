import mongoose from 'mongoose';
import { Bike } from '../models/Bike.js';
import { Document } from '../models/Document.js';
import { ServiceHistory } from '../models/ServiceHistory.js';
import { AppError } from '../utils/AppError.js';

function toPlain(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  o.id = String(o._id);
  delete o._id;
  delete o.__v;
  return o;
}

function leanBike(b) {
  if (!b) return null;
  const { _id, __v, ...rest } = b;
  return { ...rest, id: String(_id) };
}

export async function assertBikeOwnedByUser(bikeId, userId) {
  if (!mongoose.Types.ObjectId.isValid(bikeId)) {
    throw new AppError('Bike not found', 404);
  }
  const bike = await Bike.findById(bikeId).select('userId').lean();
  if (!bike) throw new AppError('Bike not found', 404);
  if (!bike.userId || String(bike.userId) !== String(userId)) {
    throw new AppError('Forbidden', 403);
  }
}

export async function createBike(data, userId) {
  const { userId: _ignored, ...rest } = data;
  const bike = await Bike.create({ ...rest, userId });
  return toPlain(bike);
}

export async function listBikes(userId) {
  const bikes = await Bike.find({ userId }).sort({ createdAt: -1 }).lean();
  return bikes.map((b) => leanBike(b));
}

export async function getBikeById(id, userId) {
  const bike = await Bike.findOne({ _id: id, userId }).lean();
  if (!bike) throw new AppError('Bike not found', 404);
  return leanBike(bike);
}

export async function updateBike(id, data, userId) {
  await assertBikeOwnedByUser(id, userId);
  const { userId: _ignored, ...patch } = data;
  const bike = await Bike.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  }).lean();
  if (!bike) throw new AppError('Bike not found', 404);
  return leanBike(bike);
}

export async function deleteBike(id, userId) {
  await assertBikeOwnedByUser(id, userId);
  const bike = await Bike.findByIdAndDelete(id).lean();
  if (!bike) throw new AppError('Bike not found', 404);
  await Promise.all([
    Document.deleteMany({ bikeId: id }),
    ServiceHistory.deleteMany({ bikeId: id }),
  ]);
  return { id: String(bike._id) };
}
