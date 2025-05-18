const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// @desc    Send notification to students
// @route   POST /api/notifications/send
// @access  Private/Admin
exports.sendNotification = asyncHandler(async (req, res) => {
  const { message, studentIds } = req.body;

  try {
    // Validate message
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message',
      });
    }

    // If no studentIds provided, send to all students
    const query = studentIds ? { _id: { $in: studentIds }, role: 'student' } : { role: 'student' };

    // Get students with phone numbers and names
    const students = await User.find(query, { phone: 1, name: 1 });

    // Filter out students without phone numbers
    const studentsWithPhones = students.filter(student => student.phone);

    if (studentsWithPhones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No students with phone numbers found',
      });
    }

    // Prepare personalized messages for each student
    const notifications = studentsWithPhones.map(student => ({
      phone: student.phone,
      message: `Hello ${student.name}! ${message}`
    }));

    // Send notifications
    const responses = await Promise.all(
      notifications.map(({ phone, message }) => 
        notificationService.sendWhatsAppNotification([phone], message)
      )
    );

    // Create response object
    const notificationResponse = {
      success: true,
      message: 'Notifications sent successfully',
      details: {
        totalStudents: students.length,
        studentsWithPhones: studentsWithPhones.length,
        responses: responses,
      },
    };

    res.status(200).json(notificationResponse);
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});
