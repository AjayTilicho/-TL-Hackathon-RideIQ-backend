import { asyncHandler } from '../utils/asyncHandler.js';
import * as serviceHistoryService from '../services/serviceHistoryService.js';

export const createService = asyncHandler(async (req, res) => {
  const row = await serviceHistoryService.createService(req.body, req.user.id);
  res.status(201).json({ success: true, data: row });
});

export const getServicesByBike = asyncHandler(async (req, res) => {
  const list = await serviceHistoryService.listServicesByBike(req.params.bikeId, req.user.id);
  res.json({ success: true, data: list });
});

export const updateService = asyncHandler(async (req, res) => {
  const row = await serviceHistoryService.updateService(req.params.id, req.body, req.user.id);
  res.json({ success: true, data: row });
});

export const deleteService = asyncHandler(async (req, res) => {
  const result = await serviceHistoryService.deleteService(req.params.id, req.user.id);
  res.json({ success: true, data: result });
});
