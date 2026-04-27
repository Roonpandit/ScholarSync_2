import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const Admin = sequelize.define(
  'admins',
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
        notEmpty: { msg: 'Please add a name' },
      },
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please add a valid email' },
      },
    },
    password: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    role: {
      type: Sequelize.ENUM('admin'),
      allowNull: false,
      defaultValue: 'admin',
    },
    resetPasswordToken: {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'reset_password_token',
    },
    resetPasswordExpire: {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'reset_password_expire',
    },
    sessionId: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'session_id',
    },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'Active',
      validate: {
        isIn: [['Active', 'Disabled']],
      },
    },
    mustChangePassword: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'must_change_password',
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
    tableName: 'admins',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Instance method: Match user entered password to hashed password in database
Admin.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Instance method: Generate and hash password reset token
Admin.prototype.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

export default Admin;
