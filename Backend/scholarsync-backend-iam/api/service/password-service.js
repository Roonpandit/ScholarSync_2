import crypto from 'crypto';
import { Sequelize } from 'sequelize';
import { User, ActivityLog, ACTIVITY_TYPE } from 'scholarsync-backend-common';

const findUserByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  return { user };
};

const findUserByResetToken = async (token) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    where: {
      resetPasswordToken,
      resetPasswordExpire: { [Sequelize.Op.gt]: new Date() },
    },
  });
  return { user };
};

const countResetRequests = async (email, sinceMinutes = 60) => {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
  return ActivityLog.count({
    where: {
      email,
      type: ACTIVITY_TYPE.PASSWORD_RESET_REQUEST,
      createdAt: { [Sequelize.Op.gte]: since },
    },
  });
};

const invalidateResetToken = async (user) => {
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save({ validate: false });
};

const clearSessionId = async (user) => {
  user.sessionId = null;
  await user.save({ validate: false });
};

export default {
  findUserByEmail,
  findUserByResetToken,
  countResetRequests,
  invalidateResetToken,
  clearSessionId,
};
