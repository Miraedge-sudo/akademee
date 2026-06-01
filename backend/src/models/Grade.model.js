const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  term: { type: String },
  score: { type: Number },
  year: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' }
}, { timestamps: true });

module.exports = mongoose.model('Grade', GradeSchema);
