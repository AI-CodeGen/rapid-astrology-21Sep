import { Router } from 'express';
import { downloadPredictionPDF, downloadPredictionsCSV } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/prediction/:id/pdf', downloadPredictionPDF);
router.get('/predictions.csv', downloadPredictionsCSV);
export default router;
