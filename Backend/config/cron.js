const cron = require('node-cron');
const AttendanceSlot = require('../models/AttendanceSlot');
const LeaveRequest = require('../models/LeaveRequest');

// Update slot statuses every minute
const updateSlotStatuses = () => {
  //console.log('Updating slot statuses...');
  AttendanceSlot.updateAllStatuses()
    .catch(error => console.error('Error updating slot statuses:', error));
};

// Auto-close expired rejected leave requests
const autoCloseExpiredLeaveRequests = () => {
  console.log('Checking for expired rejected leave requests...');
  LeaveRequest.autoCloseExpiredRejections()
    .then(result => {
      if (result.modifiedCount > 0) {
        console.log(`Auto-closed ${result.modifiedCount} expired rejected leave requests`);
      }
    })
    .catch(error => console.error('Error auto-closing expired leave requests:', error));
};

// Schedule the job to run every second
cron.schedule('* * * * * *', updateSlotStatuses);

// Schedule auto-close job to run every hour
cron.schedule('0 * * * *', autoCloseExpiredLeaveRequests);

// Also run once on startup
updateSlotStatuses();
autoCloseExpiredLeaveRequests();

module.exports = {
  updateSlotStatuses,
  autoCloseExpiredLeaveRequests
};