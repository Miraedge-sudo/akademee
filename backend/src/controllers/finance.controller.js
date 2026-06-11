const { Payment } = require('../models');

exports.summary = async (req, res) => {
  const payments = await Payment.summary();
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  res.json({ total, count: payments.length, payments });
};

exports.list = async (req, res) => {
  const items = await Payment.list();
  res.json(items);
};

exports.getByStudent = async (req, res) => {
  const items = await Payment.findByStudent(req.params.studentId);
  res.json(items);
};

exports.create = async (req, res) => {
  const created = await Payment.create(req.body);
  res.status(201).json(created[0]);
};
