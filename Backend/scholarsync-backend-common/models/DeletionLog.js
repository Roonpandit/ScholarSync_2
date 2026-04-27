import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const DeletionLog = sequelize.define(
  'deletion_logs',
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    tableName: {
      type: Sequelize.STRING(100),
      allowNull: false,
      field: 'table_name',
    },
    entityId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'entity_id',
    },
    data: {
      type: Sequelize.JSONB,
      allowNull: false,
    },
    reason: {
      type: Sequelize.STRING(500),
      allowNull: true,
    },
    deletedBy: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'deleted_by',
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
    tableName: 'deletion_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default DeletionLog;
