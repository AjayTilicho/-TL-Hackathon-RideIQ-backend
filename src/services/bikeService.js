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

export async function createBike(data) {
  const bike = await Bike.create(data);
  return toPlain(bike);
}

function leanBike(b) {
  if (!b) return null;
  const { _id, __v, ...rest } = b;
  return { ...rest, id: String(_id) };
}

export async function listBikes(filter = {}) {
  const bikes = await Bike.find(filter).select('-image').sort({ createdAt: -1 }).lean();
  return bikes.map((b) => leanBike(b));
}

export async function getBikeById(id) {
  const bike = await Bike.findById(id).lean();
  if (!bike) throw new AppError('Bike not found', 404);
  return leanBike(bike);
}

export async function updateBike(id, data) {
  const bike = await Bike.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  if (!bike) throw new AppError('Bike not found', 404);
  return leanBike(bike);
}

export async function deleteBike(id) {
  const bike = await Bike.findByIdAndDelete(id).lean();
  if (!bike) throw new AppError('Bike not found', 404);
  await Promise.all([
    Document.deleteMany({ bikeId: id }),
    ServiceHistory.deleteMany({ bikeId: id }),
  ]);
  return { id: String(bike._id) };
}
