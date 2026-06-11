const { Enrollment } = require('../models');

// Get all enrollments for the school
const list = async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user.schoolId;
    
    // Validate school ID
    if (!schoolId) {
      return res.status(400).json({ error: 'schoolId is required' });
    }

    const result = await Enrollment.list(schoolId);
    res.json(result.rows || result);
  } catch (error) {
    console.error('Error listing enrollments:', error);
    res.status(500).json({ error: 'Failed to list enrollments' });
  }
};

// Get single enrollment by ID
const get = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Enrollment ID is required' });
    }

    const result = await Enrollment.findById(id);
    const enrollment = result.rows ? result.rows[0] : result;

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error('Error getting enrollment:', error);
    res.status(500).json({ error: 'Failed to get enrollment' });
  }
};

// Create new enrollment
const create = async (req, res) => {
  try {
    const { schoolId, studentId, classId, academicYearId, enrollmentDate, status, promotionStatus } = req.body;

    // Validate required fields
    if (!schoolId || !studentId || !classId || !academicYearId) {
      return res.status(400).json({
        error: 'Missing required fields: schoolId, studentId, classId, academicYearId'
      });
    }

    const data = {
      schoolId,
      studentId,
      classId,
      academicYearId,
      enrollmentDate: enrollmentDate || new Date().toISOString().split('T')[0],
      status: status || 'active',
      promotionStatus: promotionStatus || 'pending'
    };

    const result = await Enrollment.create(data);
    const enrollment = result.rows ? result.rows[0] : result;

    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({ error: 'Failed to create enrollment' });
  }
};

// Update enrollment
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, promotionStatus } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Enrollment ID is required' });
    }

    // Only allow status and promotion_status updates
    if (!status && promotionStatus === undefined) {
      return res.status(400).json({
        error: 'Provide status or promotionStatus to update'
      });
    }

    const data = {};
    if (status) data.status = status;
    if (promotionStatus !== undefined) data.promotionStatus = promotionStatus;

    const result = await Enrollment.update(id, data);
    const enrollment = result.rows ? result.rows[0] : result;

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ error: 'Failed to update enrollment' });
  }
};

// Delete enrollment (SUPER_ADMIN only)
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Enrollment ID is required' });
    }

    // Check if Enrollment model has delete method, if not we can just return a message
    if (Enrollment.delete) {
      const result = await Enrollment.delete(id);
      if (!result) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
};

module.exports = {
  list,
  get,
  create,
  update,
  remove
};
