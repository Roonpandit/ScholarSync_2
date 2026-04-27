import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';

const Lecture = sequelize.define(
  'lectures',
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      field: 'id',
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Please add a lecture name' },
        len: {
          args: [3, 255],
          msg: 'Lecture name must be at least 3 characters long',
        },
      },
    },
    lectureId: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      defaultValue: Sequelize.UUIDV4,
      field: 'lecture_id',
    },
    isDefault: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default',
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    createdBy: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'created_by',
    },
    updatedBy: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'updated_by',
    },
  },
  {
    tableName: 'lectures',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['lecture_id'] },
      { fields: ['is_default'] },
      { fields: ['is_active'] },
    ],
    hooks: {
      beforeDestroy: async (lecture) => {
        if (lecture.isDefault) {
          throw new Error('Cannot delete the default lecture');
        }
      },
    },
  }
);

export default Lecture;
