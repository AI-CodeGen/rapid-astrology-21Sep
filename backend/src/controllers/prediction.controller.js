import Prediction from '../models/Prediction.js';
import { calculateNameNumber, cachedDestinyMatch } from '../services/numerology.service.js';
import { buildSuccessPayload, buildErrorPayload } from '../utils/errorCodes.js';

export async function nameNumber(req, res, next) {
  try {
    const { name } = req.body;
  if (!name) return res.status(400).json(buildErrorPayload({ error: 'VALIDATION_ERROR', message: 'Name required', status: 400, requestId: req.requestId, details: [{ field: 'name', code: 'NAME_REQUIRED', message: 'Name required' }] }));
    const result = calculateNameNumber(name);
    const prediction = await Prediction.create({ user: req.dbUser._id, discipline: 'numerology', type: 'name-number', input: { name }, result });
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { prediction }, message: 'prediction_created' }));
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
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { predictions: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, message: 'predictions_list' }));
  } catch (e) { next(e); }
}

export async function destinyMatch(req, res, next) {
  try {
    const { firstName, secondName } = req.body;
  if (!firstName || !secondName) return res.status(400).json(buildErrorPayload({ error: 'VALIDATION_ERROR', message: 'firstName and secondName required', status: 400, requestId: req.requestId, details: [{ field: 'firstName', code: 'FIRST_NAME_REQUIRED', message: 'firstName required' }, { field: 'secondName', code: 'SECOND_NAME_REQUIRED', message: 'secondName required' }] }));
    const result = await cachedDestinyMatch(firstName, secondName);
    const prediction = await Prediction.create({ user: req.dbUser._id, discipline: 'numerology', type: 'destiny-match', input: { firstName, secondName }, result });
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { prediction }, message: 'prediction_created' }));
  } catch (e) { next(e); }
}
