import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const IPSettings = sequelize.define(
  'ip_settings',
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      field: 'id',
    },
    isEnabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_enabled',
    },
    updatedBy: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'updated_by',
    },
    createdBy: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'created_by',
    },
  },
  {
    tableName: 'ip_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default IPSettings;
