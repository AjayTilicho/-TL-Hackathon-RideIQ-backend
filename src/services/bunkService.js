import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { PetrolBunk } from '../models/PetrolBunk.js';
import { BunkRating } from '../models/BunkRating.js';
import { BunkComment } from '../models/BunkComment.js';
import { AppError } from '../utils/AppError.js';

const SEED_BUNKS = [
  {
    externalId: 'b1',
    rank: 1,
    name: 'HP Petrol Pump',
    location: 'Madhapur, near Cyber Towers',
    seedDefaultStars: 5,
    isSeed: true,
  },
  {
    externalId: 'b2',
    rank: 2,
    name: 'Indian Oil — Kondapur',
    location: 'Kondapur Main Road, near DLF',
    seedDefaultStars: 4,
    isSeed: true,
  },
  {
    externalId: 'b3',
    rank: 3,
    name: 'BPCL Speed — Gachibowli',
    location: 'Gachibowli flyover, near Inorbit Mall',
    seedDefaultStars: 4,
    isSeed: true,
  },
];

function trustFromAvg(avg) {
  if (avg == null || Number.isNaN(avg)) return '—';
  const v = Math.min(5, Math.max(0, avg));
  return `${v.toFixed(1)}/5`;
}

function boostFromAvg(avg) {
  if (avg == null || Number.isNaN(avg)) return '—';
  if (avg >= 4.5) return '+2.5 km/L';
  if (avg >= 4) return '+1.8 km/L';
  if (avg >= 3.5) return '+1.2 km/L';
  return '+0.8 km/L';
}

function accentRankForRank(rank) {
  if (rank === 1) return 'accent';
  if (rank === 2) return 'muted';
  return 'outline';
}

function mapBunkToApi(bunkDoc, avgStars, ratingCount, commentCount) {
  const seed = bunkDoc.seedDefaultStars ?? 4;
  const effectiveAvg = ratingCount > 0 && avgStars != null ? avgStars : seed;
  const stars = Math.min(5, Math.max(1, Math.round(effectiveAvg * 10) / 10));
  const reviews = commentCount + ratingCount;
  return {
    id: bunkDoc.externalId,
    rank: bunkDoc.rank,
    name: bunkDoc.name,
    location: bunkDoc.location,
    stars,
    trust: trustFromAvg(effectiveAvg),
    boost: boostFromAvg(effectiveAvg),
    reviews,
    accentRank: accentRankForRank(bunkDoc.rank),
    averageRating: ratingCount > 0 ? Math.round((avgStars ?? 0) * 100) / 100 : null,
    ratingCount,
    commentCount,
  };
}

export async function ensureSeedBunks() {
  const count = await PetrolBunk.countDocuments();
  if (count > 0) return;
  await PetrolBunk.insertMany(SEED_BUNKS);
}

async function resolveBunk(idOrExternal) {
  if (mongoose.isValidObjectId(idOrExternal)) {
    const byId = await PetrolBunk.findById(idOrExternal);
    if (byId) return byId;
  }
  return PetrolBunk.findOne({ externalId: idOrExternal });
}

export async function listBunksWithStats() {
  await ensureSeedBunks();
  const bunks = await PetrolBunk.find().sort({ rank: 1 }).lean();
  const out = [];
  for (const b of bunks) {
    const bid = b._id;
    const [agg] = await BunkRating.aggregate([
      { $match: { bunkId: bid } },
      { $group: { _id: null, avg: { $avg: '$stars' }, c: { $sum: 1 } } },
    ]);
    const commentCount = await BunkComment.countDocuments({ bunkId: bid });
    out.push(mapBunkToApi(b, agg?.avg ?? null, agg?.c ?? 0, commentCount));
  }
  return out.sort((a, b) => a.rank - b.rank);
}

export async function listAllBunkComments() {
  await ensureSeedBunks();
  const rows = await BunkComment.find().sort({ createdAt: -1 }).lean();
  const bunks = await PetrolBunk.find().select('_id externalId').lean();
  const idToExternal = new Map(bunks.map((x) => [String(x._id), x.externalId]));
  return rows.map((r) => ({
    id: String(r._id),
    bunkId: idToExternal.get(String(r.bunkId)) ?? String(r.bunkId),
    text: r.text,
    createdAt: r.createdAt?.toISOString?.() ?? new Date().toISOString(),
  }));
}

export async function createBunk({ name, location, stars, initialComment }) {
  await ensureSeedBunks();
  const maxRank = await PetrolBunk.findOne().sort({ rank: -1 }).select('rank').lean();
  const rank = (maxRank?.rank ?? 0) + 1;
  const externalId = `u-${crypto.randomUUID()}`;
  const starVal = Math.min(5, Math.max(1, Math.round(Number(stars) || 4)));
  const doc = await PetrolBunk.create({
    externalId,
    name: name.trim(),
    location: location.trim(),
    rank,
    isSeed: false,
    seedDefaultStars: starVal,
  });
  await BunkRating.create({ bunkId: doc._id, stars: starVal });
  if (initialComment?.trim()) {
    await BunkComment.create({ bunkId: doc._id, text: initialComment.trim().slice(0, 2000) });
  }
  const list = await listBunksWithStats();
  const row = list.find((x) => x.id === externalId);
  if (!row) throw new AppError('Failed to load created bunk', 500);
  return row;
}

export async function addBunkComment(bunkKey, text) {
  const bunk = await resolveBunk(bunkKey);
  if (!bunk) throw new AppError('Bunk not found', 404);
  const row = await BunkComment.create({ bunkId: bunk._id, text: String(text).trim().slice(0, 2000) });
  return {
    id: String(row._id),
    bunkId: bunk.externalId,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function rateBunk(bunkKey, stars) {
  const bunk = await resolveBunk(bunkKey);
  if (!bunk) throw new AppError('Bunk not found', 404);
  const s = Math.min(5, Math.max(1, Math.round(Number(stars))));
  await BunkRating.create({ bunkId: bunk._id, stars: s });
  const list = await listBunksWithStats();
  const row = list.find((x) => x.id === bunk.externalId);
  if (!row) throw new AppError('Bunk not found after rating', 404);
  return row;
}

export async function deleteBunkIfAllowed(bunkKey) {
  const bunk = await resolveBunk(bunkKey);
  if (!bunk) throw new AppError('Bunk not found', 404);
  if (bunk.isSeed) throw new AppError('Cannot delete seeded community bunks', 403);
  await Promise.all([
    BunkRating.deleteMany({ bunkId: bunk._id }),
    BunkComment.deleteMany({ bunkId: bunk._id }),
    PetrolBunk.deleteOne({ _id: bunk._id }),
  ]);
  return { id: bunk.externalId };
}
