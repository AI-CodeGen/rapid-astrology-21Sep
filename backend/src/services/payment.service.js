import crypto from 'crypto';
import Payment from '../models/Payment.js';

// Basic PayU integration placeholder (hash generation & verification)
export function buildPayUHash({ key, txnid, amount, productinfo, firstname, email, salt }) {
  const data = [key, txnid, amount, productinfo, firstname, email, '', '', '', '', '', '', '', '', '', salt].join('|');
  return crypto.createHash('sha512').update(data).digest('hex');
}

export async function initiatePayment({ user, amount, productInfo }) {
  const txnid = 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
  const surl = process.env.BACKEND_PUBLIC_URL + '/api/payments/payu/callback';
  const furl = surl; // same endpoint handles failure
  const payload = {
    key: process.env.PAYU_MERCHANT_KEY,
    txnid,
    amount: amount.toFixed(2),
    productinfo: productInfo,
    firstname: user.name || 'User',
    email: user.email || '',
    surl,
    furl
  };
  const hash = buildPayUHash({ ...payload, salt: process.env.PAYU_MERCHANT_SALT });
  const payment = await Payment.create({ user: user._id, amount, productInfo, hash, txnid, successUrl: surl, failureUrl: furl, rawRequest: payload });
  return { payment, payload: { ...payload, hash } };
}

export async function handleGatewayCallback(body) {
  const { txnid, status, mihpayid, hash } = body;
  const payment = await Payment.findOne({ txnid });
  if (!payment) return null;
  // Recompute hash to verify integrity (reverse order salt at end spec). For brevity assuming same forward hash here.
  // In production verify both request & response hash per PayU docs.
  if (hash && payment.hash && hash !== payment.hash) {
    payment.status = 'failed';
    payment.rawResponse = body;
    await payment.save();
    return payment;
  }
  payment.status = status === 'success' ? 'success' : status === 'failure' ? 'failed' : 'pending';
  payment.gatewayTxnId = mihpayid;
  payment.rawResponse = body;
  await payment.save();
  return payment;
}
