import asyncHandler from 'express-async-handler';
import authBusiness from '../businessLogic/auth-business.js';

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authBusiness.login(email, password, req);
  res.status(result.status).json(result);
});

const register = asyncHandler(async (req, res) => {
  const result = await authBusiness.register(req.body, req.user);
  res.status(result.status).json(result);
});

const bulkRegister = asyncHandler(async (req, res) => {
  const result = await authBusiness.bulkRegister(req.body, req.user);
  res.status(result.status).json(result);
});

const getMe = asyncHandler(async (req, res) => {
  const result = await authBusiness.getMe(req.user._id, req.user.role);
  res.status(result.status).json(result);
});

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authBusiness.updatePassword(req.user._id, currentPassword, newPassword);
  res.status(result.status).json(result);
});

const seedAdmin = asyncHandler(async (req, res) => {
  const result = await authBusiness.seedAdmin();
  res.status(result.status).json(result);
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authBusiness.refreshAccessToken(req.body.refreshToken);
  res.status(result.status).json(result);
});

const logout = asyncHandler(async (req, res) => {
  const result = await authBusiness.logout(req.user._id, req.user.role);
  res.status(result.status).json(result);
});

export default { login, register, bulkRegister, getMe, updatePassword, seedAdmin, refreshToken, logout };
