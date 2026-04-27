import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const AttendanceSlot = sequelize.define(
  'attendance_slots',
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      field: 'id',
    },
    shift: {
      type: Sequelize.ENUM('morning', 'afternoon', 'evening'),
      allowNull: false,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: Sequelize.DATE,
      allowNull: false,
      field: 'start_time',
    },
    endTime: {
      type: Sequelize.DATE,
      allowNull: false,
      field: 'end_time',
    },
    status: {
      type: Sequelize.ENUM('upcoming', 'active', 'closed'),
      allowNull: false,
      defaultValue: 'upcoming',
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    lectureId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'lecture_id',
    },
    emailSent: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'email_sent',
    },
    notified: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notificationSentAt: {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'notification_sent_at',
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
    tableName: 'attendance_slots',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['date', 'shift'] },
      { fields: ['is_active'] },
      { fields: ['lecture_id'] },
      { fields: ['lecture_id', 'status'] },
    ],
    hooks: {
      beforeCreate: (slot) => {
        slot.status = slot.calculateStatus();
      },
      beforeUpdate: (slot) => {
        slot.status = slot.calculateStatus();
      },
    },
  }
);

// Instance method: Calculate status based on current time
AttendanceSlot.prototype.calculateStatus = function () {
  const now = new Date();
  const startTime = new Date(this.startTime);
  const endTime = new Date(this.endTime);

  if (now < startTime) {
    return 'upcoming';
  } else if (now < endTime) {
    return 'active';
  } else {
    return 'closed';
  }
};

// Instance method: Get times
AttendanceSlot.prototype.getTimes = function () {
  return {
    startTime: this.startTime,
    endTime: this.endTime,
  };
};

// Static method: Update status for all slots
AttendanceSlot.updateAllStatuses = async function () {
  try {
    const slots = await this.findAll();
    const updatePromises = slots.map((slot) => {
      const newStatus = slot.calculateStatus();
      if (slot.status !== newStatus) {
        return this.update(
          { status: newStatus },
          { where: { id: slot.id } }
        ).catch((error) => {
          console.error(`Error updating slot ${slot.id}:`, error.message);
          return null;
        });
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error in updateAllStatuses:', error);
  }
};

export default AttendanceSlot;
