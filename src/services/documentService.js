import { Document } from '../models/Document.js';
import { AppError } from '../utils/AppError.js';
import { assertBikeOwnedByUser } from './bikeService.js';

function mapDoc(d) {
  if (!d) return null;
  const raw = d.toObject ? d.toObject() : { ...d };
  const { _id, __v, ...rest } = raw;
  return { ...rest, id: String(_id) };
}

function labelFromCategory(category) {
  switch (category) {
    case 'license':
      return 'License';
    case 'rc':
      return 'RC';
    case 'insurance':
      return 'Insurance';
    case 'puc':
      return 'PUC';
    default:
      return 'Other';
  }
}

function normalizeCreatePayload(body) {
  const category = body.category || 'other';
  const type = (body.type && String(body.type).trim()) || labelFromCategory(category);
  return {
    ...body,
    category,
    type,
    name: (body.name && String(body.name).trim()) || 'Document',
    mimeType: (body.mimeType && String(body.mimeType).trim()) || '',
  };
}

async function assertDocumentOwned(docId, userId) {
  const doc = await Document.findById(docId).select('bikeId').lean();
  if (!doc) throw new AppError('Document not found', 404);
  await assertBikeOwnedByUser(doc.bikeId, userId);
}

export async function createDocument(payload, userId) {
  await assertBikeOwnedByUser(payload.bikeId, userId);
  const normalized = normalizeCreatePayload(payload);
  const doc = await Document.create(normalized);
  return mapDoc(doc);
}

export async function listDocumentsByBike(bikeId, userId) {
  await assertBikeOwnedByUser(bikeId, userId);
  const list = await Document.find({ bikeId }).select('-image').sort({ createdAt: -1 }).lean();
  return list.map((d) => mapDoc(d));
}

export async function getDocumentById(id, userId) {
  await assertDocumentOwned(id, userId);
  const doc = await Document.findById(id).lean();
  if (!doc) throw new AppError('Document not found', 404);
  return mapDoc(doc);
}

export async function updateDocument(id, data, userId) {
  await assertDocumentOwned(id, userId);
  const updated = await Document.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
    .select('-image')
    .lean();
  if (!updated) throw new AppError('Document not found', 404);
  return mapDoc(updated);
}

export async function deleteDocument(id, userId) {
  await assertDocumentOwned(id, userId);
  const removed = await Document.findByIdAndDelete(id).lean();
  if (!removed) throw new AppError('Document not found', 404);
  return { id: String(removed._id) };
}
