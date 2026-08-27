import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { Sequelize } from 'sequelize';
import { getClientIp } from 'request-ip';
import User from '../models/User.js';
import AllowedIP from '../models/AllowedIP.js';
import RefreshToken from '../models/RefreshToken.js';
import { sendResponse } from '../utils/response-utils.js';
import { STATUS_CODE } from '../constants/status-codes.js';
import { USER_ROLE, USER_STATUS } from '../constants/application-constant.js';

// Kill user session — invalidate tokens
const killSession = async (userId) => {
  await User.update(
    { sessionId: null },
    { where: { userId } }
  );
  await RefreshToken.destroy({ where: { userId: userId.toString() } });
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);

    if (!user) {
      const payload = sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1005' }, 'protect');
      return res.status(payload.status).json(payload);
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      const payload = sendResponse(STATUS_CODE.FORBIDDEN, { code: '1027' }, 'protect');
      return res.status(payload.status).json(payload);
    }

    if (decoded.sessionId) {
      if (!user.sessionId || decoded.sessionId !== user.sessionId) {
        const payload = sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1024' }, 'protect');
        return res.status(payload.status).json(payload);
      }
    }

    req.user = {
      _id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      orgId: decoded.orgId,
    };

    // IP restriction — only for students and teachers
    if (decoded.role === USER_ROLE.STUDENT || decoded.role === USER_ROLE.TEACHER) {
      const clientIp = getClientIp(req);
      const orgId = decoded.orgId;

      const appliesToValues = decoded.role === USER_ROLE.STUDENT
        ? ['student', 'both']
        : ['teacher', 'both'];

      const allowedIPs = await AllowedIP.findAll({
        where: {
          orgId,
          isEnabled: true,
          appliesTo: { [Sequelize.Op.in]: appliesToValues },
        },
        attributes: ['ipAddress'],
      });

      if (allowedIPs.length > 0) {
        const isAllowed = allowedIPs.some(ip => ip.ipAddress === clientIp);

        if (!isAllowed) {
          await killSession(decoded.id);
          const payload = sendResponse(STATUS_CODE.FORBIDDEN, { code: '1013' }, 'protect');
          return res.status(payload.status).json(payload);
        }
      }
    }

    next();
  } catch (err) {
    const payload = sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1011' }, 'protect');
    return res.status(payload.status).json(payload);
  }
});

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
