import { ServiceHistory } from '../models/ServiceHistory.js';
import { AppError } from '../utils/AppError.js';
import { assertBikeOwnedByUser } from './bikeService.js';

function mapRow(row) {
  if (!row) return null;
  const raw = row.toObject ? row.toObject() : { ...row };
  const { _id, __v, ...rest } = raw;
  return { ...rest, id: String(_id) };
}

async function assertServiceOwned(id, userId) {
  const row = await ServiceHistory.findById(id).select('bikeId').lean();
  if (!row) throw new AppError('Service record not found', 404);
  await assertBikeOwnedByUser(row.bikeId, userId);
}

export async function createService(payload, userId) {
  await assertBikeOwnedByUser(payload.bikeId, userId);
  const rec = await ServiceHistory.create(payload);
  return mapRow(rec);
}

export async function listServicesByBike(bikeId, userId) {
  await assertBikeOwnedByUser(bikeId, userId);
  const list = await ServiceHistory.find({ bikeId }).sort({ serviceDate: -1 }).lean();
  return list.map((r) => mapRow(r));
}

export async function updateService(id, data, userId) {
  await assertServiceOwned(id, userId);
  const updated = await ServiceHistory.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  if (!updated) throw new AppError('Service record not found', 404);
  return mapRow(updated);
}

export async function deleteService(id, userId) {
  await assertServiceOwned(id, userId);
  const removed = await ServiceHistory.findByIdAndDelete(id).lean();
  if (!removed) throw new AppError('Service record not found', 404);
  return { id: String(removed._id) };
}
