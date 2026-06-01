const mongoose = require('mongoose');

const AcademicYearSchema = new mongoose.Schema({
  start: { type: Number },
  end: { type: Number },
  active: { type: Boolean, default: false },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });

module.exports = mongoose.model('AcademicYear', AcademicYearSchema);
