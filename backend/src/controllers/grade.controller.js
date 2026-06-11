const { Grade } = require('../models');

exports.list = async (req, res) => {
  const items = await Grade.list();
  res.json(items);
};

exports.getByStudent = async (req, res) => {
  const items = await Grade.findByStudent(req.params.studentId);
  res.json(items);
};

exports.create = async (req, res) => {
  const created = await Grade.create(req.body);
  res.status(201).json(created[0]);
};
