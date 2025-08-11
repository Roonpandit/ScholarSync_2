const cron = require('node-cron');
const AttendanceSlot = require('../models/AttendanceSlot');

// Update slot statuses every minute
const updateSlotStatuses = () => {
  //console.log('Updating slot statuses...');
  AttendanceSlot.updateAllStatuses()
    .catch(error => console.error('Error updating slot statuses:', error));
};

// Schedule the job to run every second
cron.schedule('* * * * * *', updateSlotStatuses);

// Also run once on startup
updateSlotStatuses();

module.exports = {
  updateSlotStatuses
};