const cron = require('node-cron');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');
const { sendTeacherReviewEmail } = require('../services/teacherReviewEmailService');

// Function to mark pending attendance as absent when slots close
const markPendingAsAbsent = async () => {
  try {
    const now = new Date();

    // Find all slots that have just closed (status changed from active to closed)
    const closedSlots = await AttendanceSlot.find({
      status: 'closed',
      endTime: { $lte: now }
    });

    if (closedSlots.length === 0) {
      return;
    }

    let totalMarkedAbsent = 0;

    // For each closed slot, mark students from that batch as absent
    for (const slot of closedSlots) {
      // Get all students in this batch
      const User = require('../models/Student');
      const studentsInBatch = await User.find({
        batches: slot.batch,
        role: 'student'
      }).select('_id');

      const studentIds = studentsInBatch.map(s => s._id);

      // IMPORTANT: Only mark 'pending' status as absent
      // Do NOT touch 'awaiting_approval' records - those need teacher review
      const result = await Attendance.updateMany(
        {
          slot: slot._id,
          student: { $in: studentIds },
          status: 'pending' // Only mark pending as absent
        },
        {
          $set: {
            status: 'absent'
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Marked ${result.modifiedCount} students as absent for slot ${slot._id} (${slot.shift} shift, Batch: ${slot.batch})`);
        totalMarkedAbsent += result.modifiedCount;
      }

      // Check if there are any 'awaiting_approval' records for this slot
      const awaitingApprovalCount = await Attendance.countDocuments({
        slot: slot._id,
        status: 'awaiting_approval'
      });

      // If there are pending reviews, send email to teachers
      if (awaitingApprovalCount > 0) {
        console.log(`Found ${awaitingApprovalCount} attendance(s) awaiting approval for slot ${slot._id}`);

        // Send email to teachers
        sendTeacherReviewEmail({
          batchId: slot.batch,
          slotId: slot._id,
          shift: slot.shift,
          date: slot.date,
          pendingCount: awaitingApprovalCount
        }).catch(err => {
          console.error('Error sending teacher review email:', err);
        });
      }
    }

    if (totalMarkedAbsent > 0) {
      console.log(`Total students marked absent: ${totalMarkedAbsent}`);
    }
  } catch (error) {
    console.error('Error in markPendingAsAbsent cron job:', error);
  }
};

// Schedule the job to run every minute
const scheduleMarkAbsent = () => {
  cron.schedule('*/1 * * * *', markPendingAsAbsent);
  console.log('Mark absent cron job initialized - runs every minute');
};

module.exports = {
  scheduleMarkAbsent,
  markPendingAsAbsent // Export for testing
};
