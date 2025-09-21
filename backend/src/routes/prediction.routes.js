import { Router } from 'express';
import { nameNumber, listPredictions, destinyMatch } from '../controllers/prediction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.post('/numerology/name-number', nameNumber);
router.post('/numerology/destiny-match', destinyMatch);
router.get('/', listPredictions);
export default router;
