import { Router } from 'express';
import { createPayment, listPayments, payuCallback, paymentByTxn } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Define router first before using
const router = Router();

// Public callback (PayU posts here) BEFORE auth middleware
router.post('/payu/callback', payuCallback);

// Protected routes
router.use(authenticate);
router.post('/initiate', createPayment);
router.get('/', listPayments);
router.get('/tx/:txnid', paymentByTxn);

export default router;
