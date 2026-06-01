const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN','TEACHER','STUDENT'], default: 'STUDENT' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
