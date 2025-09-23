import { Router } from 'express';
import { searchPlaces } from '../services/place.service.js';
import { buildSuccessPayload, buildErrorPayload } from '../utils/errorCodes.js';

const router = Router();

// GET /api/places/search?q=del&limit=3
router.get('/search', async (req, res) => {
  const { q, limit } = req.query;
  if (!q || q.length < 3) {
    return res.status(400).json(buildErrorPayload({ error: 'VALIDATION_ERROR', message: 'Query too short', status: 400, requestId: req.requestId, details: [{ field: 'q', code: 'QUERY_TOO_SHORT', message: 'More than 2 characters needed' }] }));
  }
  try {
    const results = await searchPlaces(q, { limit: Math.min(parseInt(limit,10) || 3, 10) });
    res.json(buildSuccessPayload({ requestId: req.requestId, data: { results }, message: 'places_found' }));
  } catch (e) {
    res.status(502).json(buildErrorPayload({ error: 'UPSTREAM_ERROR', message: 'Place lookup failed', status: 502, requestId: req.requestId, details: [{ code: 'UPSTREAM_ERROR', message: e.message }] }));
  }
});

export default router;
