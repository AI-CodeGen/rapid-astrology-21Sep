import { initiatePayment, handleGatewayCallback } from '../services/payment.service.js';
import { buildSuccessPayload, buildErrorPayload } from '../utils/errorCodes.js';
import Payment from '../models/Payment.js';

export async function createPayment(req, res, next) {
  try {
    const { amount, productInfo } = req.body;
  if (!amount) return res.status(400).json(buildErrorPayload({ error: 'VALIDATION_ERROR', message: 'Amount required', status: 400, requestId: req.requestId, details: [{ field: 'amount', code: 'AMOUNT_REQUIRED', message: 'Amount required' }] }));
    const { payment, payload } = await initiatePayment({ user: req.dbUser, amount: Number(amount), productInfo });
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { paymentId: payment._id, gateway: 'payu', payload }, message: 'payment_initiated' }));
  } catch (e) { next(e); }
}

export async function listPayments(req, res, next) {
  try {
    const items = await Payment.find({ user: req.dbUser._id }).sort({ createdAt: -1 }).limit(50);
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { payments: items }, message: 'payments_list' }));
  } catch (e) { next(e); }
}

export async function paymentByTxn(req, res, next) {
  try {
    const { txnid } = req.params;
    const payment = await Payment.findOne({ txnid, user: req.dbUser._id });
  if (!payment) return res.status(404).json(buildErrorPayload({ error: 'NOT_FOUND', message: 'Payment not found', status: 404, requestId: req.requestId }));
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { payment }, message: 'payment_detail' }));
  } catch (e) { next(e); }
}

// Public callback (no auth) - verify and then redirect user based on status
export async function payuCallback(req, res, next) {
  try {
    const payment = await handleGatewayCallback(req.body);
    if (!payment) return res.status(404).send('Payment not found');
    const redirectBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const target = payment.status === 'success' ? '/payment/success' : '/payment/failure';
    res.redirect(redirectBase + target + '?txnid=' + encodeURIComponent(payment.txnid));
  } catch (e) { next(e); }
}
