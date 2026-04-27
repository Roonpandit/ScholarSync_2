import cron from 'node-cron';
import { AttendanceSlot, LeaveRequest } from 'scholarsync-backend-common';

const updateSlotStatuses = () => {
  AttendanceSlot.updateAllStatuses()
    .catch(error => console.error('Error updating slot statuses:', error));
};

const autoCloseExpiredLeaveRequests = () => {
  console.log('Checking for expired rejected leave requests...');
  LeaveRequest.autoCloseExpiredRejections()
    .then(result => {
      if (result && result[0] > 0) {
        console.log(`Auto-closed ${result[0]} expired rejected leave requests`);
      }
    })
    .catch(error => console.error('Error auto-closing expired leave requests:', error));
};

cron.schedule('* * * * * *', updateSlotStatuses);
cron.schedule('0 * * * *', autoCloseExpiredLeaveRequests);

updateSlotStatuses();
autoCloseExpiredLeaveRequests();

export { updateSlotStatuses, autoCloseExpiredLeaveRequests };
