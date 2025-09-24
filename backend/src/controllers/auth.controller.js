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
    // Standardized nested envelope (no root-level token/user)
    const base = buildSuccessPayload({ requestId: req.requestId, data: {}, message: 'otp_verified' });
    res.json({ ...base, data: { token, user: serializeUser(user) } });
  } catch (e) { next(e); }
}

export async function me(req, res) {
  const base = buildSuccessPayload({ requestId: req.requestId, data: {}, message: 'me' });
  res.json({ ...base, data: { user: req.user } });
}

export async function updateProfileBasics(req, res, next) {
  try {
    const { name, email, theme, userBasicDetails } = req.body;
    if (name !== undefined) req.dbUser.name = name;
    if (email !== undefined) req.dbUser.email = email;
    if (theme !== undefined) req.dbUser.settings.theme = theme;

    if (userBasicDetails) {
      // Merge strategy: take existing (if any), overlay provided fields, then set atomically.
      const existing = req.dbUser.userBasicDetails ? req.dbUser.userBasicDetails.toObject() : {};
      const merged = { ...existing };

      if ('dob' in userBasicDetails) {
        if (userBasicDetails.dob) merged.dob = new Date(userBasicDetails.dob);
        else delete merged.dob; // allow clearing if needed (though required if subdoc exists fully)
      }
      if ('time' in userBasicDetails && userBasicDetails.time) {
        const { hour, minute, second } = userBasicDetails.time;
        merged.time = {
          hour: hour !== undefined ? Number(hour) : existing?.time?.hour,
          minute: minute !== undefined ? Number(minute) : existing?.time?.minute,
          second: second !== undefined ? Number(second) : existing?.time?.second || 0,
        };
      }
      if ('place' in userBasicDetails) {
        // Accept string or structured object with coords/administrative fields.
        merged.place = userBasicDetails.place;
      }

      const isEmptyBefore = !req.dbUser.userBasicDetails;
      // If creating new basic details, ensure we have at least required core fields to avoid cryptic validation spam.
      if (isEmptyBefore) {
        const hasDob = merged.dob instanceof Date && !isNaN(merged.dob.valueOf());
        const hasTime = merged.time && typeof merged.time.hour === 'number' && typeof merged.time.minute === 'number';
        const hasPlace = merged.place && ((typeof merged.place === 'string' && merged.place.trim()) || merged.place.name);
        if ((hasDob || hasTime || hasPlace) && !(hasDob && hasTime && hasPlace)) {
          return res.status(400).json(buildErrorPayload({
            error: 'VALIDATION_ERROR',
            status: 400,
            requestId: req.requestId,
            message: 'Incomplete basic details: dob, time (hour & minute) and place are required to set basic details',
            details: [
              ...(hasDob ? [] : [{ field: 'userBasicDetails.dob', code: 'FIELD_REQUIRED', message: 'Date of birth required' }]),
              ...(hasTime ? [] : [{ field: 'userBasicDetails.time', code: 'FIELD_REQUIRED', message: 'Hour & minute required' }]),
              ...(hasPlace ? [] : [{ field: 'userBasicDetails.place', code: 'FIELD_REQUIRED', message: 'Place required' }])
            ]
          }));
        }
      }
      if (Object.keys(merged).length > 0) {
        req.dbUser.set('userBasicDetails', merged);
      }
    }

    await req.dbUser.save();
    if (name !== undefined) await invalidateNumerologyCache();
    // Standardized envelope: place user inside data.user (OpenAPI spec compliant)
    const base = buildSuccessPayload({ requestId: req.requestId, data: {}, message: 'profile_updated' });
    res.json({ ...base, data: { user: serializeUser(req.dbUser) } });
  } catch (e) { next(e); }
}
