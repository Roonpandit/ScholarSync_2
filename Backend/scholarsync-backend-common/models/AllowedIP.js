import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const AllowedIP = sequelize.define(
  'allowed_ips',
  {
    ipId: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      field: 'ip_id',
    },
    ipAddress: {
      type: Sequelize.STRING(45),
      allowNull: false,
      field: 'ip_address',
    },
    locationName: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: 'location_name',
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    isEnabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      field: 'is_enabled',
    },
    appliesTo: {
      type: Sequelize.STRING(20),
      allowNull: false,
      field: 'applies_to',
      validate: {
        isIn: [['student', 'teacher', 'both']],
      },
    },
    orgId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'org_id',
    },
    addedBy: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'added_by',
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
    tableName: 'allowed_ips',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default AllowedIP;
