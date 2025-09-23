import User from '../models/User.js';
import { generateAndStoreOTP, verifyOTP } from '../services/otp.service.js';
import { sendOtpSms } from '../services/notification.service.js';
import { signToken } from '../services/jwt.service.js';
import { invalidateNumerologyCache } from '../services/numerology.service.js';
import { serializeUser } from '../utils/serializeUser.js';
import { buildSuccessPayload, buildErrorPayload, VALIDATION_CODE_MAP } from '../utils/errorCodes.js';

export async function requestOTP(req, res, next) {
  try {
    const { phone } = req.body;
  if (!phone) return res.status(400).json(buildErrorPayload({ error: 'VALIDATION_ERROR', message: 'Phone required', status: 400, requestId: req.requestId, details: [{ field: 'phone', code: 'PHONE_REQUIRED', message: 'Phone required' }] }));
    const result = await generateAndStoreOTP({ phone });
    if (result.success === false && result.reason === 'resend_too_soon') {
  return res.status(429).json(buildErrorPayload({ error: 'RATE_LIMIT', message: 'OTP resend too soon', status: 429, requestId: req.requestId, details: [VALIDATION_CODE_MAP.RATE_LIMIT_OTP_REQUEST] }));
    }
    // Attempt async send (non-blocking if needed)
    try { await sendOtpSms({ phone, otp: result.otp }); } catch (err) { console.warn('OTP SMS send failed:', err.message); }
    const includeOtp = (process.env.NODE_ENV || '').toLowerCase() === 'test';
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { phone: result.phone, expiresAt: result.expiresAt, ...(includeOtp && result.otp ? { otp: result.otp } : {}) }, message: 'otp_requested' }));
  } catch (e) { next(e); }
}

export async function verifyOTPController(req, res, next) {
  try {
    const { phone, otp } = req.body;
    const { valid, user, reason } = await verifyOTP({ phone, otp });
  if (!valid) return res.status(400).json(buildErrorPayload({ error: 'VALIDATION_ERROR', message: 'Invalid OTP', status: 400, requestId: req.requestId, details: [{ field: 'otp', code: 'OTP_INVALID', message: reason || 'Invalid OTP' }] }));
    user.lastLoginAt = new Date();
    await user.save();
    const token = signToken({ uid: user._id, roles: user.roles });
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { token, user: serializeUser(user) }, message: 'otp_verified' }));
  } catch (e) { next(e); }
}

export async function me(req, res) {
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { user: req.user }, message: 'me' }));
}

export async function updateProfileBasics(req, res, next) {
  try {
    const { name, email, theme } = req.body;
    if (name) req.dbUser.name = name;
    if (email) req.dbUser.email = email;
    if (theme) req.dbUser.settings.theme = theme;
    await req.dbUser.save();
    // Invalidate numerology cache if user's name changed (affects display context for predictions maybe)
    await invalidateNumerologyCache();
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { user: serializeUser(req.dbUser), cacheInvalidated: true }, message: 'profile_updated' }));
  } catch (e) { next(e); }
}
