const { School } = require('../models');

exports.list = async (req, res) => {
  const items = await School.list();
  res.json(items);
};

exports.get = async (req, res) => {
  const item = await School.findById(req.params.id);
  res.json(item);
};

exports.create = async (req, res) => {
  const created = await School.create(req.body);
  res.status(201).json(created[0]);
};
