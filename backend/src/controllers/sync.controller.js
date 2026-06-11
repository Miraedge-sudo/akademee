const { OfflineSyncQueue } = require('../models');

// Get all sync queue items
const list = async (req, res) => {
  try {
    const { schoolId, status, limit } = req.query;
    const userSchoolId = schoolId || req.user.schoolId;

    if (!userSchoolId) {
      return res.status(400).json({ error: 'schoolId is required' });
    }

    const queryLimit = limit ? parseInt(limit, 10) : 100;
    const result = await OfflineSyncQueue.list(userSchoolId, status || null, queryLimit);
    res.json(result.rows || result);
  } catch (error) {
    console.error('Error listing sync queue:', error);
    res.status(500).json({ error: 'Failed to list sync queue' });
  }
};

// Get items by status
const getByStatus = async (req, res) => {
  try {
    const { schoolId, status } = req.query;
    const userSchoolId = schoolId || req.user.schoolId;

    if (!userSchoolId) {
      return res.status(400).json({ error: 'schoolId is required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const result = await OfflineSyncQueue.list(userSchoolId, status, 100);
    res.json(result.rows || result);
  } catch (error) {
    console.error('Error getting sync items by status:', error);
    res.status(500).json({ error: 'Failed to get sync items by status' });
  }
};

// Mark sync item as synced
const markSynced = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Queue ID is required' });
    }

    const result = await OfflineSyncQueue.markSynced(id);
    const item = result.rows ? result.rows[0] : result;

    if (!item) {
      return res.status(404).json({ error: 'Sync queue item not found' });
    }

    res.json({ message: 'Item marked as synced', item });
  } catch (error) {
    console.error('Error marking item synced:', error);
    res.status(500).json({ error: 'Failed to mark item as synced' });
  }
};

// Mark sync item as failed
const markFailed = async (req, res) => {
  try {
    const { id } = req.params;
    const { errorMessage, retryCount } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Queue ID is required' });
    }

    const result = await OfflineSyncQueue.markFailed(
      id,
      errorMessage || null,
      retryCount || 1
    );
    const item = result.rows ? result.rows[0] : result;

    if (!item) {
      return res.status(404).json({ error: 'Sync queue item not found' });
    }

    res.json({ message: 'Item marked as failed', item });
  } catch (error) {
    console.error('Error marking item failed:', error);
    res.status(500).json({ error: 'Failed to mark item as failed' });
  }
};

// Retry failed sync items
const retry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Queue ID is required' });
    }

    // Reset retry count and mark as pending for retry
    // This would require a retry method in the model, or we update directly
    const result = await OfflineSyncQueue.markFailed(id, null, 0);
    const item = result.rows ? result.rows[0] : result;

    if (!item) {
      return res.status(404).json({ error: 'Sync queue item not found' });
    }

    res.json({ message: 'Item ready for retry', item });
  } catch (error) {
    console.error('Error retrying sync item:', error);
    res.status(500).json({ error: 'Failed to retry sync item' });
  }
};

// Get failed sync items that can be retried
const getFailedItems = async (req, res) => {
  try {
    const { schoolId, maxRetries } = req.query;
    const userSchoolId = schoolId || req.user.schoolId;

    if (!userSchoolId) {
      return res.status(400).json({ error: 'schoolId is required' });
    }

    const max = maxRetries ? parseInt(maxRetries, 10) : 3;
    const result = await OfflineSyncQueue.getFailedItems(userSchoolId, max);
    res.json(result.rows || result);
  } catch (error) {
    console.error('Error getting failed sync items:', error);
    res.status(500).json({ error: 'Failed to get failed sync items' });
  }
};

module.exports = {
  list,
  getByStatus,
  markSynced,
  markFailed,
  retry,
  getFailedItems
};
