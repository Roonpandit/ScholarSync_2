import asyncHandler from 'express-async-handler';
import ipBusiness from '../businessLogic/ip-business.js';

const manageIP = asyncHandler(async (req, res) => {
  const result = await ipBusiness.manageIP(req.body, req.user._id);
  res.status(result.status).json(result);
});

const deleteIP = asyncHandler(async (req, res) => {
  const result = await ipBusiness.deleteIP(req.params.id);
  res.status(result.status).json(result);
});

const getIPStatus = asyncHandler(async (req, res) => {
  const result = await ipBusiness.getIPStatus();
  res.status(result.status).json(result);
});

export default { manageIP, deleteIP, getIPStatus };
