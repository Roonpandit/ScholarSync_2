const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { sendFeedbackEmails } = require('../controllers/reviewController');
const User = require('../models/User');

// Get all students for review page
router.get('/students', protect, authorize('admin'), async (req, res) => {
    try {
        console.log('Fetching students from database...');
        const students = await User.find({ role: 'student' }).select('name email studentCode');
        console.log('Found students:', students);
        res.status(200).json({ students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch students'
        });
    }
});

// Send feedback emails
router.post('/send-feedback', protect, authorize('admin'), sendFeedbackEmails);

module.exports = router;
