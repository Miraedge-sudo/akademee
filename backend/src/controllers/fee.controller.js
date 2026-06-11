const { FeeStructure } = require('../models');

// Get all fee structures for the school
const list = async (req, res) => {
  try {
    const { schoolId, academicYearId, levelId } = req.query;
    const userSchoolId = req.query.schoolId || req.user.schoolId;

    if (!userSchoolId) {
      return res.status(400).json({ error: 'schoolId is required' });
    }

    const result = await FeeStructure.list(userSchoolId, academicYearId, levelId);
    res.json(result.rows || result);
  } catch (error) {
    console.error('Error listing fee structures:', error);
    res.status(500).json({ error: 'Failed to list fee structures' });
  }
};

// Get single fee structure by ID
const get = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Fee structure ID is required' });
    }

    const result = await FeeStructure.findById(id);
    const feeStructure = result.rows ? result.rows[0] : result;

    if (!feeStructure) {
      return res.status(404).json({ error: 'Fee structure not found' });
    }

    res.json(feeStructure);
  } catch (error) {
    console.error('Error getting fee structure:', error);
    res.status(500).json({ error: 'Failed to get fee structure' });
  }
};

// Create new fee structure
const create = async (req, res) => {
  try {
    const { schoolId, academicYearId, levelId, feeType, amount, isMandatory, description } = req.body;

    // Validate required fields
    if (!schoolId || !academicYearId || !levelId || !feeType || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: schoolId, academicYearId, levelId, feeType, amount'
      });
    }

    // Validate amount is positive
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const data = {
      schoolId,
      academicYearId,
      levelId,
      feeType,
      amount: parseFloat(amount),
      isMandatory: isMandatory !== false,
      description: description || null,
      createdBy: req.user.userId
    };

    const result = await FeeStructure.create(data);
    const feeStructure = result.rows ? result.rows[0] : result;

    res.status(201).json(feeStructure);
  } catch (error) {
    console.error('Error creating fee structure:', error);
    res.status(500).json({ error: 'Failed to create fee structure' });
  }
};

// Update fee structure
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, isMandatory, description } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Fee structure ID is required' });
    }

    // Validate at least one field is provided
    if (amount === undefined && isMandatory === undefined && description === undefined) {
      return res.status(400).json({
        error: 'Provide at least one field to update: amount, isMandatory, description'
      });
    }

    // Validate amount if provided
    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const data = {};
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (isMandatory !== undefined) data.isMandatory = isMandatory;
    if (description !== undefined) data.description = description;

    const result = await FeeStructure.update(id, data);
    const feeStructure = result.rows ? result.rows[0] : result;

    if (!feeStructure) {
      return res.status(404).json({ error: 'Fee structure not found' });
    }

    res.json(feeStructure);
  } catch (error) {
    console.error('Error updating fee structure:', error);
    res.status(500).json({ error: 'Failed to update fee structure' });
  }
};

module.exports = {
  list,
  get,
  create,
  update
};
