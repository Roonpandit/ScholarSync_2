const express = require('express');
const {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  getDefaultBatch,
  getStudentsByBatch,
  assignBatchesToStudents,
  unassignBatchesFromStudents,
  getNonDefaultBatches,
  getTeacherForBatch
} = require('../controllers/batchController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin-only routes for batch data
router.get('/', authorize('admin'), getAllBatches);
router.get('/default/info', authorize('admin'), getDefaultBatch);
router.get('/:id', authorize('admin'), getBatchById);
router.get('/:id/students', authorize('admin'), getStudentsByBatch);

// Batch-Student assignment (Admin only - teachers cannot assign/unassign batches)
router.post('/assign', authorize('admin'), assignBatchesToStudents);
router.post('/unassign', authorize('admin'), unassignBatchesFromStudents);

// Admin-only routes
router.post('/', authorize('admin'), createBatch);
router.put('/:id', authorize('admin'), updateBatch);
router.delete('/:id', authorize('admin'), deleteBatch);

// Student routes for leave management
router.get('/non-default', authorize('student'), getNonDefaultBatches);
router.get('/:batchId/teacher', authorize('student'), getTeacherForBatch);

module.exports = router;
