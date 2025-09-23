// Centralized OTP configuration & helper logic
// Adjust these values or later load from env / remote feature flag.
// retryWindowSeconds: window during which repeated OTP generation attempts are limited
// minResendIntervalSeconds: minimal interval before allowing another OTP generation (rate limiting layer complement)

export default {
  length: parseInt(process.env.OTP_LENGTH || '4', 10), // 4 | 6 | 8 etc.
  type: process.env.OTP_TYPE || 'numeric', // 'numeric' | 'alphabetic' | 'alphanumeric'
  expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  minResendIntervalSeconds: parseInt(process.env.OTP_MIN_RESEND_INTERVAL || '30', 10),
  retryWindowSeconds: parseInt(process.env.OTP_RETRY_WINDOW || '300', 10),
  maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10)
};
