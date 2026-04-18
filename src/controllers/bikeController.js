import { asyncHandler } from '../utils/asyncHandler.js';
import * as bikeService from '../services/bikeService.js';

export const createBike = asyncHandler(async (req, res) => {
  const bike = await bikeService.createBike(req.body, req.user.id);
  res.status(201).json({ success: true, data: bike });
});

export const getBikes = asyncHandler(async (req, res) => {
  const bikes = await bikeService.listBikes(req.user.id);
  res.json({ success: true, data: bikes });
});

export const getBike = asyncHandler(async (req, res) => {
  const bike = await bikeService.getBikeById(req.params.id, req.user.id);
  res.json({ success: true, data: bike });
});

export const updateBike = asyncHandler(async (req, res) => {
  const bike = await bikeService.updateBike(req.params.id, req.body, req.user.id);
  res.json({ success: true, data: bike });
});

export const deleteBike = asyncHandler(async (req, res) => {
  const result = await bikeService.deleteBike(req.params.id, req.user.id);
  res.json({ success: true, data: result });
});
