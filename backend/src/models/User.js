import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relation: { type: String },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { _id: true, timestamps: true });

const UserSchema = new mongoose.Schema({
  phone: { type: String, index: true },
  email: { type: String, lowercase: true, index: true },
  googleId: { type: String, index: true },
  name: { type: String },
  passwordHash: { type: String }, // for optional fallback login
  otpHash: { type: String },
  otpExpiresAt: { type: Date },
  roles: { type: [String], default: ['user'] },
  members: { type: [MemberSchema], default: [] },
  lastLoginAt: { type: Date },
  settings: {
    theme: { type: String, enum: ['day', 'night'], default: 'day' }
  }
}, { timestamps: true });

UserSchema.index({ phone: 1, email: 1 });

export default mongoose.model('User', UserSchema);
