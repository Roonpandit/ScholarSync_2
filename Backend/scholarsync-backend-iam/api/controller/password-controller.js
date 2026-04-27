import asyncHandler from 'express-async-handler';
import passwordBusiness from '../businessLogic/password-business.js';

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await passwordBusiness.forgotPassword(req.body.email);
  res.status(result.status).json(result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await passwordBusiness.resetPassword(req.params.resetToken, req.body.password);
  res.status(result.status).json(result);
});

export default { forgotPassword, resetPassword };
