import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['initiated', 'success', 'failed', 'pending'], default: 'initiated' },
  gateway: { type: String, default: 'payu' },
  txnid: { type: String, index: true },
  gatewayTxnId: { type: String },
  productInfo: { type: String },
  hash: { type: String },
  successUrl: { type: String },
  failureUrl: { type: String },
  rawRequest: { type: mongoose.Schema.Types.Mixed },
  rawResponse: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

PaymentSchema.index({ user: 1, status: 1 });

export default mongoose.model('Payment', PaymentSchema);
