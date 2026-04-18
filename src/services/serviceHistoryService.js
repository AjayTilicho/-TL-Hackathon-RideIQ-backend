import { ServiceHistory } from '../models/ServiceHistory.js';
import { Bike } from '../models/Bike.js';
import { AppError } from '../utils/AppError.js';

function mapRow(row) {
  if (!row) return null;
  const raw = row.toObject ? row.toObject() : { ...row };
  const { _id, __v, ...rest } = raw;
  return { ...rest, id: String(_id) };
}

async function assertBikeExists(bikeId) {
  const exists = await Bike.exists({ _id: bikeId });
  if (!exists) throw new AppError('Bike not found', 404);
}

export async function createService(payload) {
  await assertBikeExists(payload.bikeId);
  const rec = await ServiceHistory.create(payload);
  return mapRow(rec);
}

export async function listServicesByBike(bikeId) {
  await assertBikeExists(bikeId);
  const list = await ServiceHistory.find({ bikeId }).sort({ serviceDate: -1 }).lean();
  return list.map((r) => mapRow(r));
}

export async function updateService(id, data) {
  const updated = await ServiceHistory.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  if (!updated) throw new AppError('Service record not found', 404);
  return mapRow(updated);
}

export async function deleteService(id) {
  const removed = await ServiceHistory.findByIdAndDelete(id).lean();
  if (!removed) throw new AppError('Service record not found', 404);
  return { id: String(removed._id) };
}
