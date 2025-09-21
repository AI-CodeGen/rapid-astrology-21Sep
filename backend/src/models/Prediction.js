import mongoose from 'mongoose';

const PredictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId },
  discipline: { type: String, enum: ['numerology', 'astrology'], required: true },
  type: { type: String, required: true }, // e.g. name-number, destiny-matching
  input: { type: mongoose.Schema.Types.Mixed, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  reportFilePath: { type: String },
  checksum: { type: String },
  paid: { type: Boolean, default: false },
  paymentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }
}, { timestamps: true });

PredictionSchema.index({ user: 1, discipline: 1, type: 1 });

export default mongoose.model('Prediction', PredictionSchema);
