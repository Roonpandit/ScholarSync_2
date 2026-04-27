import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { USER_ROLE, USER_STATUS } from '../constants/application-constant.js';

const User = sequelize.define(
  'users',
  {
    userId: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      field: 'user_id',
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
    mobile: {
      type: Sequelize.STRING(15),
      allowNull: true,
      unique: true,
    },
    role: {
      type: Sequelize.ENUM(USER_ROLE.SUPERADMIN, USER_ROLE.ADMIN, USER_ROLE.TEACHER, USER_ROLE.STUDENT),
      allowNull: false,
    },
    orgId: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'org_id',
    },
    userCode: {
      type: Sequelize.STRING(100),
      allowNull: true,
      field: 'user_code',
    },
    institutionName: {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'institution_name',
    },
    userData: {
      type: Sequelize.JSONB,
      allowNull: true,
      field: 'user_data',
    },
    lectures: {
      type: Sequelize.ARRAY(Sequelize.UUID),
      allowNull: true,
      defaultValue: [],
    },
    status: {
      type: Sequelize.ENUM(USER_STATUS.ACTIVE, USER_STATUS.DISABLED),
      allowNull: false,
      defaultValue: USER_STATUS.ACTIVE,
    },
    sessionId: {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'session_id',
    },
    mustChangePassword: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'must_change_password',
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
    tableName: 'users',
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
User.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Instance method: Generate and hash password reset token
User.prototype.getResetPasswordToken = function () {
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

export default User;
