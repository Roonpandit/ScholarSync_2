import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const AllowedIP = sequelize.define(
  'allowed_ips',
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      field: 'id',
    },
    ipAddress: {
      type: Sequelize.STRING(45),
      allowNull: false,
      unique: true,
      field: 'ip_address',
      validate: {
        is: {
          args: /^(\d{1,3}\.){3}\d{1,3}$/,
          msg: 'Please enter a valid IPv4 address (e.g., 192.168.1.1)',
        },
      },
    },
    locationName: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: 'location_name',
      validate: {
        len: {
          args: [10, 255],
          msg: 'Location name must be at least 10 characters long',
        },
      },
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    addedBy: {
      type: Sequelize.UUID,
      allowNull: false,
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
    indexes: [
      { fields: ['ip_address'] },
    ],
  }
);

export default AllowedIP;
