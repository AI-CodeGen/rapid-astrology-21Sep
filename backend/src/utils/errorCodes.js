// Central map of field-level validation error codes for frontend consumption
// Codes are stable and machine-friendly; messages are human-friendly and may change.

export const VALIDATION_CODE_MAP = {
  // name field codes
  NAME_REQUIRED: { field: 'name', code: 'NAME_REQUIRED', message: 'Name is required' },
  NAME_LENGTH: { field: 'name', code: 'NAME_LENGTH', message: 'Name length out of bounds' },
  NAME_TYPE: { field: 'name', code: 'NAME_TYPE', message: 'Name must be a string' },

  // phone field codes
  PHONE_REQUIRED: { field: 'phone', code: 'PHONE_REQUIRED', message: 'Phone is required' },
  PHONE_FORMAT: { field: 'phone', code: 'PHONE_FORMAT', message: 'Phone must be E.164 format (+15551234567)' },
  PHONE_DUPLICATE: { field: 'phone', code: 'PHONE_DUPLICATE', message: 'Phone already in use' },

  // email field codes
  EMAIL_FORMAT: { field: 'email', code: 'EMAIL_FORMAT', message: 'Email is invalid' },
  EMAIL_DUPLICATE: { field: 'email', code: 'EMAIL_DUPLICATE', message: 'Email already in use' },
  // auth / security
  AUTH_MISSING: { field: 'auth', code: 'AUTH_MISSING', message: 'Missing Authorization header' },
  AUTH_INVALID: { field: 'auth', code: 'AUTH_INVALID', message: 'Invalid or malformed token' },
  AUTH_USER_NOT_FOUND: { field: 'auth', code: 'AUTH_USER_NOT_FOUND', message: 'User not found for token' },
  // rate limit
  RATE_LIMIT_OTP_REQUEST: { field: 'otp', code: 'RATE_LIMIT_OTP_REQUEST', message: 'Too many OTP requests, please try later.' },
  RATE_LIMIT_OTP_VERIFY: { field: 'otp', code: 'RATE_LIMIT_OTP_VERIFY', message: 'Too many OTP verifications, please try later.' },
  RATE_LIMIT_GENERIC: { field: 'rate', code: 'RATE_LIMIT', message: 'Too many requests, slow down.' }
};

export function buildValidationPayload({ errors = [], aggregateMessage = 'Validation failed' }) {
  return {
    error: 'VALIDATION_ERROR',
    message: aggregateMessage,
    details: errors.map(e => ({ field: e.field, code: e.code, message: e.message }))
  };
}

// Attempt to map a single Mongoose ValidationError sub-error to a code entry
export function mapMongooseValidator(path, kind, value, properties = {}) {
  switch (path) {
    case 'name': {
      if (kind === 'required') return VALIDATION_CODE_MAP.NAME_REQUIRED;
      if (kind === 'user defined') { // custom validator length/type
        if (typeof value !== 'string') return VALIDATION_CODE_MAP.NAME_TYPE;
        return VALIDATION_CODE_MAP.NAME_LENGTH;
      }
      break; }
    case 'phone': {
      if (kind === 'required') return VALIDATION_CODE_MAP.PHONE_REQUIRED;
      if (kind === 'user defined') return VALIDATION_CODE_MAP.PHONE_FORMAT;
      break; }
    case 'email': {
      if (kind === 'user defined') return VALIDATION_CODE_MAP.EMAIL_FORMAT;
      break; }
  }
  // fallback generic
  return { field: path, code: 'FIELD_INVALID', message: properties?.message || 'Invalid value' };
}

export function mapMongoServerError(err) {
  if (err?.code === 11000 && err.keyPattern) {
    if (err.keyPattern.phone) return VALIDATION_CODE_MAP.PHONE_DUPLICATE;
    if (err.keyPattern.email) return VALIDATION_CODE_MAP.EMAIL_DUPLICATE;
  }
  return null;
}

export function buildSuccessPayload({ data = {}, requestId, message = 'ok' }) {
  return { success: true, message, requestId, timestamp: new Date().toISOString(), ...data };
}

export function buildErrorPayload({ error = 'ERROR', message, status, requestId, details }) {
  const base = { success: false, error, message, status, requestId, timestamp: new Date().toISOString() };
  if (details) base.details = details;
  return base;
}
