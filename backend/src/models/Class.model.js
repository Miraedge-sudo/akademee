const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: String },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
