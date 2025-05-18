const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { sendNotification } = require('../controllers/notificationController');

// Protect all routes in this router
router.use(protect);
router.use(authorize('admin'));

// Send notification to students
router.post('/send', sendNotification);

module.exports = router;
