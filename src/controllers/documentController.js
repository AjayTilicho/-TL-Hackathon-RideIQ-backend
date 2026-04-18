import { asyncHandler } from '../utils/asyncHandler.js';
import * as documentService from '../services/documentService.js';

export const createDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.createDocument(req.body, req.user.id);
  res.status(201).json({ success: true, data: doc });
});

export const getDocumentsByBike = asyncHandler(async (req, res) => {
  const list = await documentService.listDocumentsByBike(req.params.bikeId, req.user.id);
  res.json({ success: true, data: list });
});

export const getDocumentById = asyncHandler(async (req, res) => {
  const doc = await documentService.getDocumentById(req.params.id, req.user.id);
  res.json({ success: true, data: doc });
});

export const updateDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.updateDocument(req.params.id, req.body, req.user.id);
  res.json({ success: true, data: doc });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const result = await documentService.deleteDocument(req.params.id, req.user.id);
  res.json({ success: true, data: result });
});
