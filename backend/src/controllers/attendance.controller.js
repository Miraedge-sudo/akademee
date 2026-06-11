const { Attendance } = require('../models');

exports.list = async (req, res) => {
  const items = await Attendance.list();
  res.json(items);
};

exports.getByStudent = async (req, res) => {
  const items = await Attendance.findByStudent(req.params.studentId);
  res.json(items);
};

exports.create = async (req, res) => {
  const created = await Attendance.create(req.body);
  res.status(201).json(created[0]);
};
