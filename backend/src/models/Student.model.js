const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  studentId: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
