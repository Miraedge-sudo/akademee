const Student = require('../models/Student.model');

exports.list = async (req, res) => {
  const items = await Student.find();
  res.json(items);
};

exports.get = async (req, res) => {
  const item = await Student.findById(req.params.id);
  res.json(item);
};

exports.create = async (req, res) => {
  const created = await Student.create(req.body);
  res.status(201).json(created);
};

exports.update = async (req, res) => {
  const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

exports.remove = async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.status(204).end();
};
