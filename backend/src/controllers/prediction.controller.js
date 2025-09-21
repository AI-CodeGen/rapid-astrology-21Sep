import Prediction from '../models/Prediction.js';
import { calculateNameNumber, cachedDestinyMatch } from '../services/numerology.service.js';

export async function nameNumber(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const result = calculateNameNumber(name);
    const prediction = await Prediction.create({ user: req.dbUser._id, discipline: 'numerology', type: 'name-number', input: { name }, result });
    res.json({ prediction });
  } catch (e) { next(e); }
}

export async function listPredictions(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Prediction.find({ user: req.dbUser._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Prediction.countDocuments({ user: req.dbUser._id })
    ]);
    res.json({ predictions: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
}

export async function destinyMatch(req, res, next) {
  try {
    const { firstName, secondName } = req.body;
    if (!firstName || !secondName) return res.status(400).json({ message: 'firstName and secondName required' });
    const result = await cachedDestinyMatch(firstName, secondName);
    const prediction = await Prediction.create({ user: req.dbUser._id, discipline: 'numerology', type: 'destiny-match', input: { firstName, secondName }, result });
    res.json({ prediction });
  } catch (e) { next(e); }
}
