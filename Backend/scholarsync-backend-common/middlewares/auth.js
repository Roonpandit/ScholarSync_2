import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import AllowedIP from '../models/AllowedIP.js';
import IPSettings from '../models/IPSettings.js';
import { sendResponse } from '../utils/response-utils.js';
import { STATUS_CODE } from '../constants/status-codes.js';
import { USER_ROLE, USER_STATUS } from '../constants/application-constant.js';

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip;
};

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const payload = sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1011' }, 'protect');
    return res.status(payload.status).json(payload);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in DB
    const user = await User.findByPk(decoded.id);

    if (!user) {
      const payload = sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1005' }, 'protect');
      return res.status(payload.status).json(payload);
    }

    // Check if user account is active
    if (user.status !== USER_STATUS.ACTIVE) {
      const payload = sendResponse(STATUS_CODE.FORBIDDEN, { code: '1027' }, 'protect');
      return res.status(payload.status).json(payload);
    }

    // Session validation
    // If token has sessionId but DB has null → user logged out
    // If token has sessionId and DB has different one → logged in from another device
    if (decoded.sessionId) {
      if (!user.sessionId || decoded.sessionId !== user.sessionId) {
        const payload = sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1024' }, 'protect');
        return res.status(payload.status).json(payload);
      }
    }

    // Set user from decoded token
    req.user = {
      _id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      orgId: decoded.orgId,
    };

    // IP restriction check for students
    if (decoded.role === USER_ROLE.STUDENT) {
      if (decoded.sessionIP) {
        const currentIP = getClientIP(req);
        const normalizedCurrentIP = currentIP === '::1' ? '127.0.0.1' : currentIP.replace(/^::ffff:/, '');

        if (decoded.sessionIP !== normalizedCurrentIP) {
          const payload = sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1012' }, 'protect');
          return res.status(payload.status).json(payload);
        }
      } else {
        const ipSettings = await IPSettings.findOne();
        if (ipSettings && ipSettings.isEnabled) {
          const allowedIPs = await AllowedIP.findAll();
          if (allowedIPs.length > 0) {
            const clientIP = getClientIP(req);
            const normalizedClientIP = clientIP === '::1' ? '127.0.0.1' : clientIP.replace(/^::ffff:/, '');
            const isAllowed = allowedIPs.some(allowed => allowed.ipAddress === normalizedClientIP);

            if (!isAllowed) {
              const payload = sendResponse(STATUS_CODE.FORBIDDEN, { code: '1013' }, 'protect');
              return res.status(payload.status).json(payload);
            }
          }
        }
      }
    }

    next();
  } catch (err) {
    const payload = sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1011' }, 'protect');
    return res.status(payload.status).json(payload);
  }
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      const payload = sendResponse(STATUS_CODE.FORBIDDEN, { code: '1015' }, 'authorize');
      return res.status(payload.status).json(payload);
    }

    if (req.user.role === USER_ROLE.TEACHER && req.method === 'DELETE') {
      const payload = sendResponse(STATUS_CODE.FORBIDDEN, { code: '1014' }, 'authorize');
      return res.status(payload.status).json(payload);
    }

    next();
  };
};

const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== USER_ROLE.ADMIN) {
    const payload = sendResponse(STATUS_CODE.FORBIDDEN, { code: '1015' }, 'restrictToAdmin');
    return res.status(payload.status).json(payload);
  }
  next();
};

export { protect, authorize, restrictToAdmin };
