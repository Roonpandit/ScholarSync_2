import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const RefreshToken = sequelize.define(
  'refresh_tokens',
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      field: 'id',
    },
    userId: {
      type: Sequelize.STRING,
      allowNull: false,
      field: 'user_id',
    },
    role: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    token: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    expiresAt: {
      type: Sequelize.DATE,
      allowNull: false,
      field: 'expires_at',
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
    tableName: 'refresh_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default RefreshToken;
