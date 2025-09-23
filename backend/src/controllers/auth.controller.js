import User from '../models/User.js';
import { generateAndStoreOTP, verifyOTP } from '../services/otp.service.js';
import { sendOtpSms } from '../services/notification.service.js';
import { signToken } from '../services/jwt.service.js';
import { invalidateNumerologyCache } from '../services/numerology.service.js';
import { serializeUser } from '../utils/serializeUser.js';

export async function requestOTP(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone required' });
    const result = await generateAndStoreOTP({ phone });
    if (result.success === false && result.reason === 'resend_too_soon') {
      return res.status(429).json(result);
    }
    // Attempt async send (non-blocking if needed)
    try { await sendOtpSms({ phone, otp: result.otp }); } catch (err) { console.warn('OTP SMS send failed:', err.message); }
    const includeOtp = (process.env.NODE_ENV || '').toLowerCase() === 'test';
    res.json({ success: true, phone: result.phone, expiresAt: result.expiresAt, ...(includeOtp && result.otp ? { otp: result.otp } : {}) });
  } catch (e) { next(e); }
}

export async function verifyOTPController(req, res, next) {
  try {
    const { phone, otp } = req.body;
    const { valid, user, reason } = await verifyOTP({ phone, otp });
    if (!valid) return res.status(400).json({ message: 'Invalid OTP', reason });
    user.lastLoginAt = new Date();
    await user.save();
    const token = signToken({ uid: user._id, roles: user.roles });
  res.json({ token, user: serializeUser(user) });
  } catch (e) { next(e); }
}

export async function me(req, res) {
  res.json({ user: req.user });
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
  res.json({ user: serializeUser(req.dbUser), cacheInvalidated: true });
  } catch (e) { next(e); }
}
