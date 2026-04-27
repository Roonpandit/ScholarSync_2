import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const Attendance = sequelize.define(
  'attendances',
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
    slotId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'slot_id',
    },
    lectureId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'lecture_id',
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    shift: {
      type: Sequelize.ENUM('morning', 'afternoon', 'evening'),
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('pending', 'awaiting_approval', 'present', 'absent', 'on_leave'),
      allowNull: false,
      defaultValue: 'pending',
    },
    leaveRequestId: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'leave_request_id',
    },
    photo: {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'JSON with url, public_id, format, width, height',
    },
    location: {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'JSON with type, coordinates, address',
    },
    markedAt: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.NOW,
      field: 'marked_at',
    },
    studentCode: {
      type: Sequelize.STRING(100),
      allowNull: false,
      field: 'student_code',
    },
    studentName: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: 'student_name',
    },
    studentEmail: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: 'student_email',
    },
    statusUpdatedBy: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'status_updated_by',
    },
    remark: {
      type: Sequelize.STRING(1000),
      allowNull: true,
    },
    statusUpdatedAt: {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'status_updated_at',
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
    tableName: 'attendances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['student_id', 'slot_id'] },
      { fields: ['date'] },
      { fields: ['slot_id'] },
      { fields: ['lecture_id'] },
      { fields: ['student_code'] },
      { fields: ['status'] },
      { fields: ['slot_id', 'status'] },
      { fields: ['status_updated_by'] },
    ],
  }
);

export default Attendance;
