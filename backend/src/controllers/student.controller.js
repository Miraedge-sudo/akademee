const { Student } = require('../models');

exports.list = async (req, res) => {
  const items = await Student.list();
  res.json(items);
};

exports.get = async (req, res) => {
  const item = await Student.findById(req.params.id);
  res.json(item);
};

exports.create = async (req, res) => {
  const created = await Student.create(req.body);
  res.status(201).json(created[0]);
};

exports.update = async (req, res) => {
  const updated = await Student.update(req.params.id, req.body);
  res.json(updated[0]);
};

exports.remove = async (req, res) => {
  await Student.delete(req.params.id);
  res.status(204).end();
};
