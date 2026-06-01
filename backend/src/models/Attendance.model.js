const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['PRESENT','ABSENT','LATE'], default: 'PRESENT' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
