const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  method: { type: String },
  reference: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
