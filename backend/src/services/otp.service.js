import crypto from 'crypto';
import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import otpConfig from '../config/otp.config.js';
import client from 'prom-client';

// Prometheus metrics
const otpRequestCounter = new client.Counter({ name: 'otp_requests_total', help: 'Total OTP generation requests', labelNames: ['result'] });
const otpVerifyCounter = new client.Counter({ name: 'otp_verifications_total', help: 'Total OTP verification attempts', labelNames: ['result'] });
const otpIssuedGauge = new client.Gauge({ name: 'otp_active_users', help: 'Users currently holding an active OTP' });

// Build generation options based on config.type
function buildGeneratorOptions() {
  const base = { upperCaseAlphabets: false, specialChars: false }; // keep consistent for clarity
  switch (otpConfig.type) {
    case 'alphabetic':
      return { ...base, digits: false, alphabets: true, lowerCaseAlphabets: true };
    case 'alphanumeric':
      return { ...base, digits: true, alphabets: true, lowerCaseAlphabets: true };
    case 'numeric':
    default:
      return { ...base, digits: true, alphabets: false, lowerCaseAlphabets: false };
  }
}

function generateOTP() {
  const options = buildGeneratorOptions();
  return otpGenerator.generate(otpConfig.length, options);
}

function withinMinResendInterval(user) {
  if (!user || !user.lastOtpIssuedAt) return false;
  const last = user.lastOtpIssuedAt.getTime();
  return (Date.now() - last) < (otpConfig.minResendIntervalSeconds * 1000);
}

function markOtpIssued(user) {
  user.lastOtpIssuedAt = new Date();
  // Reset attempt counter when a new OTP is issued
  user.otpAttemptCount = 0;
}

function incrementAttempt(user) {
  user.otpAttemptCount = (user.otpAttemptCount || 0) + 1;
}

function isInRetryWindow(user) {
  if (!user.lastOtpIssuedAt) return false;
  return (Date.now() - user.lastOtpIssuedAt.getTime()) < (otpConfig.retryWindowSeconds * 1000);
}

export async function generateAndStoreOTP({ phone }) {
  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ phone });

  // Enforce minimal resend interval (does not block initial issuance)
  if (withinMinResendInterval(user)) {
    const retryAfter = Math.max(0, otpConfig.minResendIntervalSeconds - Math.floor((Date.now() - user.lastOtpIssuedAt.getTime())/1000));
    otpRequestCounter.inc({ result: 'too_soon' });
    return { success: false, reason: 'resend_too_soon', retryAfterSeconds: retryAfter };
  }

  const otp = generateOTP();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);
  const expiry = new Date(Date.now() + (otpConfig.expiryMinutes * 60000));

  user.otpHash = otpHash;
  user.otpExpiresAt = expiry;
  markOtpIssued(user);
  await user.save();
  otpRequestCounter.inc({ result: 'ok' });
  otpIssuedGauge.set(await User.countDocuments({ otpHash: { $ne: null } }));

  // TODO: Integrate real SMS gateway or email provider depending on channel.
  if (!((process.env.NODE_ENV || '').toLowerCase() === 'test' && process.env.QUIET_TESTS === '1')) {
    console.log(`OTP (${otpConfig.type}, len=${otpConfig.length}) for ${phone}: ${otp}`);
  }

  const includeOtp = (process.env.NODE_ENV || '').toLowerCase() === 'test';
  if (includeOtp) return { success: true, phone, expiresAt: expiry, otp };
  return { success: true, phone, expiresAt: expiry };
}

export async function verifyOTP({ phone, otp }) {
  const user = await User.findOne({ phone });
  if (!user || !user.otpHash || !user.otpExpiresAt) return { valid: false };
  if (user.otpExpiresAt < new Date()) return { valid: false, reason: 'expired' };

  incrementAttempt(user);
  // Basic brute force guard: if attempts exceed 5 in the retry window, invalidate current OTP
  if (isInRetryWindow(user) && user.otpAttemptCount > otpConfig.maxAttempts) {
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    otpVerifyCounter.inc({ result: 'locked' });
    return { valid: false, reason: 'locked' };
  }

  const match = await bcrypt.compare(otp, user.otpHash);
  if (!match) {
    await user.save();
    otpVerifyCounter.inc({ result: 'invalid' });
    return { valid: false };
  }
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  await user.save();
  otpVerifyCounter.inc({ result: 'valid' });
  otpIssuedGauge.set(await User.countDocuments({ otpHash: { $ne: null } }));
  return { valid: true, user };
}

export function computeChecksum(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
