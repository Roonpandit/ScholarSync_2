import asyncHandler from 'express-async-handler';
import userBusiness from '../businessLogic/user-business.js';

const getUser = asyncHandler(async (req, res) => {
  const result = await userBusiness.getUser(req.params.id, req.user);
  res.status(result.status).json(result);
});

const updateUser = asyncHandler(async (req, res) => {
  const result = await userBusiness.updateUser(req.params.id, req.body, req.user);
  res.status(result.status).json(result);
});

const deleteUser = asyncHandler(async (req, res) => {
  const result = await userBusiness.deleteUser(req.params.id, req.user);
  res.status(result.status).json(result);
});

const manageUserStatus = asyncHandler(async (req, res) => {
  const result = await userBusiness.manageUserStatus(req.params.id, req.body.action, req.user);
  res.status(result.status).json(result);
});

export default { getUser, updateUser, deleteUser, manageUserStatus };
