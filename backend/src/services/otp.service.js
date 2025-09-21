import crypto from 'crypto';
import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export async function generateAndStoreOTP({ phone }) {
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, alphabets: false });
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);
  const expiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10) * 60000));
  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ phone });
  user.otpHash = otpHash;
  user.otpExpiresAt = expiry;
  await user.save();
  // Placeholder: integrate SMS provider
  if (!((process.env.NODE_ENV || '').toLowerCase() === 'test' && process.env.QUIET_TESTS === '1')) {
    console.log(`OTP for ${phone}: ${otp}`); // remove / silence in CI when QUIET_TESTS=1
  }
  const includeOtp = (process.env.NODE_ENV || '').toLowerCase() === 'test';
  // Always return otp field in test so higher layers don't need to duplicate logic
  if (includeOtp) {
    return { success: true, phone, expiresAt: expiry, otp };
  }
  return { success: true, phone, expiresAt: expiry };
}

export async function verifyOTP({ phone, otp }) {
  const user = await User.findOne({ phone });
  if (!user || !user.otpHash || !user.otpExpiresAt) return { valid: false };
  if (user.otpExpiresAt < new Date()) return { valid: false, reason: 'expired' };
  const match = await bcrypt.compare(otp, user.otpHash);
  if (!match) return { valid: false };
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  await user.save();
  return { valid: true, user };
}

export function computeChecksum(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
