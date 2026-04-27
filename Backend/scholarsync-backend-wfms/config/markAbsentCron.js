import cron from 'node-cron';
import { Sequelize } from 'sequelize';
import { AttendanceSlot, Attendance, Student } from 'scholarsync-backend-common';

const { Op } = Sequelize;

const markPendingAsAbsent = async () => {
  try {
    const now = new Date();
    const closedSlots = await AttendanceSlot.findAll({
      where: {
        status: 'closed',
        endTime: { [Op.lte]: now }
      }
    });
    if (closedSlots.length === 0) return;

    let totalMarkedAbsent = 0;

    for (const slot of closedSlots) {
      const studentsInLecture = await Student.findAll({
        where: {
          lectures: { [Op.contains]: [slot.lectureId] },
          role: 'student'
        },
        attributes: ['id']
      });
      const studentIds = studentsInLecture.map(s => s.id);

      if (studentIds.length === 0) continue;

      const [affectedCount] = await Attendance.update(
        { status: 'absent' },
        {
          where: {
            slotId: slot.id,
            studentId: studentIds,
            status: 'pending'
          }
        }
      );

      if (affectedCount > 0) {
        console.log(`Marked ${affectedCount} students as absent for slot ${slot.id}`);
        totalMarkedAbsent += affectedCount;
      }
    }

    if (totalMarkedAbsent > 0) {
      console.log(`Total students marked absent: ${totalMarkedAbsent}`);
    }
  } catch (error) {
    console.error('Error in markPendingAsAbsent cron job:', error);
  }
};

const scheduleMarkAbsent = () => {
  cron.schedule('*/1 * * * *', markPendingAsAbsent);
  console.log('Mark absent cron job initialized');
};

export { scheduleMarkAbsent, markPendingAsAbsent };
