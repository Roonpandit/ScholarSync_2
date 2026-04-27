import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const LeaveRequest = sequelize.define(
  'leave_requests',
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      field: 'id',
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
    teacherId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'teacher_id',
    },

    // Leave Details
    leaveType: {
      type: Sequelize.ENUM('sick', 'other'),
      allowNull: false,
      field: 'leave_type',
    },
    fromDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      field: 'from_date',
    },
    toDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      field: 'to_date',
    },
    reason: {
      type: Sequelize.STRING(500),
      allowNull: false,
      validate: {
        len: {
          args: [10, 500],
          msg: 'Reason must be between 10 and 500 characters',
        },
      },
    },

    // Status Management
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled', 'closed'),
      allowNull: false,
      defaultValue: 'pending',
    },

    // Rejection Flow
    teacherRemark: {
      type: Sequelize.STRING(500),
      allowNull: true,
      field: 'teacher_remark',
    },
    studentRemark: {
      type: Sequelize.STRING(500),
      allowNull: true,
      field: 'student_remark',
    },
    rejectedAt: {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'rejected_at',
    },
    rejectExpiresAt: {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'reject_expires_at',
    },

    // Resend Tracking
    resendCount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'resend_count',
      validate: {
        max: { args: [1], msg: 'Cannot resend more than once' },
      },
    },
    isResent: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_resent',
    },
    parentRequestId: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'parent_request_id',
    },

    // Approval
    approvedAt: {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    respondedBy: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'responded_by',
    },

    // Cancellation (only for approved leaves)
    cancelledAt: {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'cancelled_at',
    },
    cancelReason: {
      type: Sequelize.STRING(500),
      allowNull: true,
      field: 'cancel_reason',
    },
    isCancelled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_cancelled',
    },

    // Timestamps
    appliedAt: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.NOW,
      field: 'applied_at',
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
    tableName: 'leave_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['student_id', 'status'] },
      { fields: ['teacher_id', 'status'] },
      { fields: ['lecture_id', 'from_date', 'to_date'] },
      { fields: ['status', 'reject_expires_at'] },
      { fields: ['from_date', 'to_date'] },
    ],
  }
);

// Instance method: Check if request can be resent
LeaveRequest.prototype.canResend = function () {
  if (this.status !== 'rejected') return false;
  if (this.resendCount >= 1) return false;
  if (!this.rejectExpiresAt) return false;

  const now = new Date();
  return now <= new Date(this.rejectExpiresAt);
};

// Instance method: Check if request can be deleted
LeaveRequest.prototype.canDelete = function () {
  return this.status === 'pending';
};

// Instance method: Check if request can be cancelled
LeaveRequest.prototype.canCancel = function () {
  return this.status === 'approved' && !this.isCancelled;
};

// Static method: Auto-close expired rejected requests
LeaveRequest.autoCloseExpiredRejections = async function () {
  try {
    const now = new Date();
    const result = await this.update(
      { status: 'closed' },
      {
        where: {
          status: 'rejected',
          rejectExpiresAt: { [Sequelize.Op.lt]: now },
        },
      }
    );
    return result;
  } catch (error) {
    console.error('Error auto-closing expired rejections:', error);
    throw error;
  }
};

export default LeaveRequest;
