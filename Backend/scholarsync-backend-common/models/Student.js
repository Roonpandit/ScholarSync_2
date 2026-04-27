import Sequelize from 'sequelize';
import { sequelize } from '../config/db-pg.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const Student = sequelize.define(
  'students',
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
        is: {
          args: /^[A-Za-z\s]+$/,
          msg: 'Name must contain only English alphabet letters (A-Z, a-z)',
        },
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
    studentCode: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
      field: 'student_code',
    },
    phone: {
      type: Sequelize.STRING(10),
      allowNull: true,
      validate: {
        is: {
          args: /^\d{10}$/,
          msg: 'Please enter a valid 10-digit phone number',
        },
      },
    },
    password: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    role: {
      type: Sequelize.ENUM('student'),
      allowNull: false,
      defaultValue: 'student',
    },
    lectures: {
      type: Sequelize.ARRAY(Sequelize.UUID),
      allowNull: false,
      defaultValue: [],
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
      defaultValue: true,
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
    tableName: 'students',
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
Student.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Instance method: Generate and hash password reset token
Student.prototype.getResetPasswordToken = function () {
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

export default Student;
