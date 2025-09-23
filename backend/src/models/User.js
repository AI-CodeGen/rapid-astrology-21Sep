import mongoose from 'mongoose';
import userConfig from '../config/user.config.js';
import { 
  nameValidation, 
  phoneValidation, 
  timeHourValidation, 
  timeMinuteValidation, 
  timeSecondValidation, 
  latitudeValidation, 
  longitudeValidation 
} from '../validators/validator.js';
import validator from 'validator';

const MemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relation: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: true, timestamps: true }
);

// Separate schema for place to allow a custom setter.
const PlaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Place of birth is required'] },
    description: { type: String },
    district: { type: String },
    state: { type: String },
    country: { type: String },
    latitude: { type: Number, validate: latitudeValidation },
    longitude: { type: Number, validate: longitudeValidation },
  },
  { _id: false }
);

const BasicDetails = new mongoose.Schema(
  {
    dob: { type: Date, required: [true, 'Date of birth is required'] },
    // Time broken into hour / minute / second for precision & validation.
    // Accepts creation/update with either an object {hour, minute, second}
    // or a string in HH:mm or HH:mm:ss format (handled in pre-validate hook below).
    time: {
      hour: { type: Number, required: [true, 'Hour of birth is required'], validate: timeHourValidation },
      minute: { type: Number, required: [true, 'Minute of birth is required'], validate: timeMinuteValidation },
      second: { type: Number, default: 0, validate: timeSecondValidation },
    },
    // Place refactored into structured object. Backward compatibility: string inputs converted to { name: <string> } in pre-validate.
    place: {
      type: PlaceSchema,
      required: [true, 'Place of birth is required'],
      set: function(v) {
        if (typeof v === 'string') {
          const trimmed = v.trim();
          if (!trimmed) return v; // will fail required validation for name
          return { name: trimmed };
        }
        return v;
      }
    },
  },
  { _id: true, timestamps: true }
);

// Allow backward-compatible string assignment (HH:mm or HH:mm:ss) to time.
BasicDetails.pre('validate', function (next) {
  // Backward compatibility for time string -> object
  if (this.isModified('time') && typeof this.time === 'string') {
    const raw = this.time.trim();
    const parts = raw.split(':');
    if (parts.length === 2 || parts.length === 3) {
      const [h, m, s = '0'] = parts;
      const hour = Number(h);
      const minute = Number(m);
      const second = Number(s);
      if (
        Number.isInteger(hour) && hour >= 0 && hour <= 23 &&
        Number.isInteger(minute) && minute >= 0 && minute <= 59 &&
        Number.isInteger(second) && second >= 0 && second <= 59
      ) {
        this.time = { hour, minute, second };
      }
    }
  }

  next();
});

// Virtual to expose formatted time string HH:mm:ss
BasicDetails.virtual('timeString').get(function () {
  if (!this.time || typeof this.time !== 'object') return undefined;
  const { hour, minute, second = 0 } = this.time;
  const pad = (n) => String(n).padStart(2, '0');
  if ([hour, minute, second].some((v) => typeof v !== 'number')) return undefined;
  return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
});

// Virtual to produce a concise place string representation
BasicDetails.virtual('placeString').get(function () {
  if (!this.place || typeof this.place !== 'object') return undefined;
  const { name, district, state, country } = this.place;
  const parts = [name, district, state, country].filter(Boolean);
  return parts.join(', ') || undefined;
});

const UserSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      index: true,
      required: [true, 'Mobile number is required'],
      unique: true,
      set: function(v) {
        if (typeof v === 'string') return v.replace(/\s+/g, '');
        return v;
      },
      validate: phoneValidation,
    },
    email: {
      type: String,
      lowercase: true,
      index: true,
      unique: true,
      sparse: true, // allow multiple docs without email
      set: function(v) {
        if (typeof v === 'string') return v.trim().toLowerCase();
        return v;
      },
      validate: {
        validator: (value) => validator.isEmail(value),
        message: 'Please enter a valid email',
      },
    },
    googleId: { type: String, index: true },
    name: {
      type: String,
      trim: true,
      set: function(v) {
        if (v != null && typeof v !== 'string') {
          this.__invalidNameOriginalType = true;
        }
        return v;
      },
      required: true,
      validate: nameValidation,
    },
    passwordHash: { type: String }, // for optional fallback login
    otpHash: { type: String },
    otpExpiresAt: { type: Date },
    lastOtpIssuedAt: { type: Date },
    otpAttemptCount: { type: Number, default: 0 },
    roles: { type: [String], default: ['user'] },
  // Basic details are optional; when provided enforce internal required fields.
  userBasicDetails: { type: BasicDetails },
    members: { type: [MemberSchema], default: [] },
    lastLoginAt: { type: Date },
    settings: {
      theme: { type: String, enum: ['day', 'night'], default: 'night' },
    },
  },
  { timestamps: true }
);

UserSchema.index({ phone: 1, email: 1 });

export default mongoose.model('User', UserSchema);
