import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import * as bunkService from '../services/bunkService.js';

export const getBunks = asyncHandler(async (_req, res) => {
  const data = await bunkService.listBunksWithStats();
  res.json({ success: true, data });
});

export const getAllComments = asyncHandler(async (_req, res) => {
  const data = await bunkService.listAllBunkComments();
  res.json({ success: true, data });
});

export const postBunk = asyncHandler(async (req, res) => {
  const { name, location, stars, initialComment } = req.body ?? {};
  if (!name?.trim() || !location?.trim()) {
    throw new AppError('name and location are required', 400);
  }
  const data = await bunkService.createBunk({
    name,
    location,
    stars: stars ?? 4,
    initialComment,
  });
  res.status(201).json({ success: true, data });
});

export const postComment = asyncHandler(async (req, res) => {
  const { text } = req.body ?? {};
  if (!text?.trim()) throw new AppError('text is required', 400);
  const data = await bunkService.addBunkComment(req.params.id, text);
  res.status(201).json({ success: true, data });
});

export const postRate = asyncHandler(async (req, res) => {
  const { stars } = req.body ?? {};
  if (stars === undefined || stars === null) throw new AppError('stars is required', 400);
  const data = await bunkService.rateBunk(req.params.id, stars);
  res.json({ success: true, data });
});

export const removeBunk = asyncHandler(async (req, res) => {
  const data = await bunkService.deleteBunkIfAllowed(req.params.id);
  res.json({ success: true, data });
});
