import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';
import { ACTIVITY_TYPE } from '../constants/application-constant.js';

const ActivityLog = sequelize.define(
  'activity_logs',
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'user_id',
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    role: {
      type: Sequelize.STRING(20),
      allowNull: true,
    },
    type: {
      type: Sequelize.STRING(50),
      allowNull: false,
      validate: {
        isIn: [Object.values(ACTIVITY_TYPE)],
      },
    },
    ipAddress: {
      type: Sequelize.STRING(45),
      allowNull: true,
      field: 'ip_address',
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: true,
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
    createdAt: {
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      type: Sequelize.DATE,
      field: 'created_at',
      allowNull: false,
    },
    updatedAt: {
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      type: Sequelize.DATE,
      field: 'updated_at',
      allowNull: false,
    },
  },
  {
    tableName: 'activity_logs',
    timestamps: true,
  }
);

export default ActivityLog;
