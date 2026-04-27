import { STATUS_CODE, sendResponse, ACTIVITY_TYPE, USER_STATUS } from 'scholarsync-backend-common';
import { forgotPasswordSchema, resetPasswordBodySchema } from '../../model-validators/auth-validator.js';
import passwordService from '../service/password-service.js';
import authService from '../service/auth-service.js';
import axios from 'axios';

const forgotPassword = async (email) => {
  const { error } = forgotPasswordSchema.validate({ email });
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'forgotPassword');

  const { user } = await passwordService.findUserByEmail(email);

  if (!user) {
    return sendResponse(STATUS_CODE.SUCCESS, { code: '5003' }, 'forgotPassword');
  }

  // Block disabled accounts
  if (user.status === USER_STATUS.DISABLED) {
    return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1027' }, 'forgotPassword');
  }

  // Rate limit: max 3 requests per hour
  const resetCount = await passwordService.countResetRequests(email);
  if (resetCount >= 3) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1038' }, 'forgotPassword');
  }

  // Invalidate any existing reset token
  await passwordService.invalidateResetToken(user);

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  try {
    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:6003';
    await axios.post(`${notificationUrl}/api/notification/v1/password-reset-email`, {
      email: user.email,
      name: user.name,
      resetToken
    });

    await authService.logActivity(email, ACTIVITY_TYPE.PASSWORD_RESET_REQUEST, null, user.id, user.role);

    return sendResponse(STATUS_CODE.SUCCESS, { code: '5004' }, 'forgotPassword', { email: user.email });
  } catch (err) {
    console.error('Error sending password reset email:', err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return sendResponse(STATUS_CODE.INTERNALERROR, { code: '1020' }, 'forgotPassword');
  }
};

const resetPassword = async (resetToken, password) => {
  const { error } = resetPasswordBodySchema.validate({ password });
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'resetPassword');

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
  if (!passwordRegex.test(password)) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1017' }, 'resetPassword');
  }

  const { user } = await passwordService.findUserByResetToken(resetToken);
  if (!user) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1018' }, 'resetPassword');
  }

  try {
    const isSamePassword = await user.matchPassword(password);
    if (isSamePassword) {
      return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1008' }, 'resetPassword');
    }
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1019' }, 'resetPassword');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  try {
    await user.save({ validateBeforeSave: true });

    // Kill all sessions
    await passwordService.clearSessionId(user);

    // Log the reset
    await authService.logActivity(user.email, ACTIVITY_TYPE.PASSWORD_RESET_COMPLETE, null, user.id, user.role);

    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:6003';
    await axios.post(`${notificationUrl}/api/notification/v1/password-reset-confirmation`, {
      email: user.email,
      name: user.name
    }).catch(() => {});

    return sendResponse(STATUS_CODE.SUCCESS, { code: '5005' }, 'resetPassword');
  } catch (err) {
    console.error('Error in password reset:', err);
    return sendResponse(STATUS_CODE.SUCCESS, { code: '5006' }, 'resetPassword');
  }
};

export default { forgotPassword, resetPassword };
