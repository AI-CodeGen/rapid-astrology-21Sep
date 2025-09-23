import mongoose from 'mongoose';
import userConfig from '../config/user.config.js';
import { nameValidation, phoneValidation } from '../validators/validator.js';
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
    members: { type: [MemberSchema], default: [] },
    lastLoginAt: { type: Date },
    settings: {
      theme: { type: String, enum: ['day', 'night'], default: 'day' },
    },
  },
  { timestamps: true }
);

UserSchema.index({ phone: 1, email: 1 });

export default mongoose.model('User', UserSchema);
