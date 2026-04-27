import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const UpdateHistory = sequelize.define(
  'update_history',
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    entityType: {
      type: Sequelize.STRING(50),
      allowNull: false,
      field: 'entity_type',
    },
    entityId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'entity_id',
    },
    actionType: {
      type: Sequelize.STRING(20),
      allowNull: false,
      field: 'action_type',
      validate: {
        isIn: [['updateData', 'changeStatus', 'created']],
      },
    },
    originalData: {
      type: Sequelize.JSONB,
      allowNull: true,
      field: 'original_data',
    },
    editData: {
      type: Sequelize.JSONB,
      allowNull: true,
      field: 'edit_data',
    },
    updatedByUser: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'updated_by_user',
    },
    ipAddress: {
      type: Sequelize.STRING(45),
      allowNull: true,
      field: 'ip_address',
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
    tableName: 'update_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default UpdateHistory;
