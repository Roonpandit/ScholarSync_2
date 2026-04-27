import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const LeaveSlot = sequelize.define(
  'leave_slots',
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      field: 'id',
    },
    leaveRequestId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'leave_request_id',
    },
    studentId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'student_id',
    },
    lectureId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'lecture_id',
    },
    attendanceSlotId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'attendance_slot_id',
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('blocked', 'on_leave', 'cancelled'),
      allowNull: false,
      defaultValue: 'blocked',
    },
    createdBy: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'created_by',
    },
    updatedBy: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'updated_by',
    },
  },
  {
    tableName: 'leave_slots',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['student_id', 'lecture_id', 'date'] },
      { unique: true, fields: ['attendance_slot_id', 'student_id'] },
      { fields: ['leave_request_id'] },
      { fields: ['status'] },
    ],
  }
);

// Static method: Check if student has leave for a specific slot
LeaveSlot.hasLeaveForSlot = async function (studentId, attendanceSlotId) {
  try {
    const leaveSlot = await this.findOne({
      where: {
        studentId,
        attendanceSlotId,
        status: { [Sequelize.Op.in]: ['blocked', 'on_leave'] },
      },
    });
    return leaveSlot !== null;
  } catch (error) {
    console.error('Error checking leave slot:', error);
    return false;
  }
};

// Static method: Create leave slots for a date range
LeaveSlot.createSlotsForLeave = async function (leaveRequestId, studentId, lectureId, fromDate, toDate) {
  try {
    // Import AttendanceSlot dynamically to avoid circular dependency
    const { default: AttendanceSlot } = await import('./AttendanceSlot.js');

    // Find all attendance slots in the date range for the lecture
    const slots = await AttendanceSlot.findAll({
      where: {
        lectureId,
        date: {
          [Sequelize.Op.gte]: new Date(fromDate),
          [Sequelize.Op.lte]: new Date(toDate),
        },
        isActive: true,
      },
    });

    if (slots.length === 0) {
      return [];
    }

    // Create leave slots for each attendance slot
    const leaveSlots = slots.map((slot) => ({
      leaveRequestId,
      studentId,
      lectureId,
      attendanceSlotId: slot.id,
      date: slot.date,
      status: 'blocked',
    }));

    // Insert all leave slots (ignoreDuplicates handles unique constraint violations)
    const createdSlots = await this.bulkCreate(leaveSlots, {
      ignoreDuplicates: true,
    });
    return createdSlots;
  } catch (error) {
    console.error('Error creating leave slots:', error);
    throw error;
  }
};

// Static method: Update leave slot status when request is approved
LeaveSlot.approveLeaveSlots = async function (leaveRequestId) {
  try {
    const result = await this.update(
      { status: 'on_leave' },
      {
        where: {
          leaveRequestId,
          status: 'blocked',
        },
      }
    );
    return result;
  } catch (error) {
    console.error('Error approving leave slots:', error);
    throw error;
  }
};

// Static method: Cancel future leave slots when leave is cancelled
LeaveSlot.cancelFutureSlots = async function (leaveRequestId) {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result = await this.update(
      { status: 'cancelled' },
      {
        where: {
          leaveRequestId,
          date: { [Sequelize.Op.gte]: now },
          status: 'on_leave',
        },
      }
    );
    return result;
  } catch (error) {
    console.error('Error cancelling future leave slots:', error);
    throw error;
  }
};

// Static method: Delete leave slots when request is deleted/rejected
LeaveSlot.deleteLeaveSlots = async function (leaveRequestId) {
  try {
    const result = await this.destroy({
      where: { leaveRequestId },
    });
    return result;
  } catch (error) {
    console.error('Error deleting leave slots:', error);
    throw error;
  }
};

export default LeaveSlot;
