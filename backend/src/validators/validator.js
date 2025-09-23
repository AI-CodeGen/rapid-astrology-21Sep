// Centralized validation utilities
// Add additional validators here as needed (email, phone, etc.)
import userConfig from '../config/user.config.js';

const MIN_NAME = Number(userConfig?.userNameLength) || 3;
const MAX_NAME = Number(userConfig?.userNameMaxLength) || 30;
// E.164 pattern: + followed by 8-15 digits, first digit 1-9
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

// Mongoose style validate object for the User.name field (always enforced).
export const nameValidation = {
  validator: function(v) {
    if (v == null) return false; // required at schema level; guard anyway
    if (this.__invalidNameOriginalType) return false;
    if (typeof v !== 'string') return false;
    const t = v.trim();
    return t.length >= MIN_NAME && t.length <= MAX_NAME;
  },
  message: () => `Name must be between ${MIN_NAME} and ${MAX_NAME} non-space characters`
};

// Optionally export a factory if different behavior is needed later
export function buildNameValidation() { return nameValidation; }

export const phoneValidation = {
  validator: function(v) {
    if (typeof v !== 'string') return false;
    return E164_REGEX.test(v);
  },
  message: () => 'Phone must be a valid E.164 number (e.g. +15551234567)'
};

// Generic numeric range validator factory
function buildRangeValidator(min, max, label) {
  return {
    validator: function(v) {
      if (v == null) return false; // required handled at schema but guard
      if (typeof v !== 'number' || Number.isNaN(v)) return false;
      return v >= min && v <= max;
    },
    message: () => `${label} must be between ${min} and ${max}`
  };
}

// Time component validators
export const timeHourValidation = buildRangeValidator(0, 23, 'Hour');
export const timeMinuteValidation = buildRangeValidator(0, 59, 'Minute');
export const timeSecondValidation = buildRangeValidator(0, 59, 'Second');

// Geo coordinate validators
export const latitudeValidation = buildRangeValidator(-90, 90, 'Latitude');
export const longitudeValidation = buildRangeValidator(-180, 180, 'Longitude');
