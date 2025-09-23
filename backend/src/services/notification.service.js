// Abstract notification service (SMS / Email) for OTP delivery.
// For production, plug in Twilio, AWS SNS, SendGrid, etc.

export async function sendOtpSms({ phone, otp }) {
  // Placeholder: integrate SMS provider here
  if (!phone) throw new Error('phone required');
  // In real implementation, handle provider response / errors
  return { queued: true };
}

export async function sendOtpEmail({ email, otp }) {
  // Optional email channel
  if (!email) throw new Error('email required');
  return { queued: true };
}
