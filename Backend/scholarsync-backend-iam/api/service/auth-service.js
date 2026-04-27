import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Sequelize } from 'sequelize';
import { User, AllowedIP, IPSettings, RefreshToken, ActivityLog, ACTIVITY_TYPE, USER_STATUS } from 'scholarsync-backend-common';

const findUserByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (user) return { user, role: user.role };
  return { user: null, role: null };
};

const findUserById = async (id) => {
  return User.findByPk(id, { attributes: { exclude: ['password'] } });
};

const findUserWithPassword = async (id) => {
  return User.findByPk(id);
};

const getIPRestrictionState = async () => {
  const ipSettings = await IPSettings.findOne();
  if (!ipSettings || !ipSettings.isEnabled) return { enabled: false, allowedIPs: [] };

  const allowedIPs = await AllowedIP.findAll();
  return { enabled: true, allowedIPs };
};

// Token generation — in service layer, not on models
const generateAccessToken = (user, role, sessionIP = null) => {
  const payload = {
    id: user.userId,
    role,
    email: user.email,
    name: user.name,
    orgId: user.orgId,
    sessionId: user.sessionId,
  };

  if (user.userCode) payload.userCode = user.userCode;
  if (sessionIP) payload.sessionIP = sessionIP;

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (user, role) => {
  return jwt.sign(
    { id: user.userId, role, orgId: user.orgId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
};

const saveRefreshToken = async (userId, role, token) => {
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  // Upsert — replace existing token for this user
  const existing = await RefreshToken.findOne({ where: { userId: userId.toString() } });
  if (existing) {
    await existing.update({ token, role, expiresAt });
    return existing;
  }
  return RefreshToken.create({
    userId: userId.toString(),
    role,
    token,
    expiresAt,
  });
};

const findRefreshToken = async (userId) => {
  return RefreshToken.findOne({ where: { userId: userId.toString() } });
};

const deleteRefreshToken = async (userId) => {
  return RefreshToken.destroy({ where: { userId: userId.toString() } });
};

const findUserByIdForRefresh = async (id) => {
  return User.findByPk(id);
};

const updateSessionId = async (user) => {
  const sessionId = crypto.randomUUID();
  user.sessionId = sessionId;
  await user.save({ validate: false });
  return sessionId;
};

// Sequence: 5 fails → lock 1min → 3 more → lock 2min → 2 more → lock 3min → 1 more → permanent disable
// TODO: Revert to production values: { 5: 15min, 8: 60min, 10: 360min, 11: permanent }
const LOCKOUT_TIERS = [
  { attempts: 5, durationMinutes: 1 },    // 5 fails → lock 1min → 3 more chances
  { attempts: 8, durationMinutes: 2 },    // 8 fails → lock 2min → 2 more chances
  { attempts: 10, durationMinutes: 3 },   // 10 fails → lock 3min → 1 more chance
  { attempts: 11, durationMinutes: null }, // 11 fails → permanent disable
];

const checkLoginAttempts = async (email) => {
  // Count ALL failed attempts since last successful login
  const lastSuccess = await ActivityLog.findOne({
    where: { email, type: ACTIVITY_TYPE.LOGIN_SUCCESS },
    order: [['createdAt', 'DESC']],
  });

  const whereCondition = {
    email,
    type: ACTIVITY_TYPE.LOGIN_FAILED,
    ...(lastSuccess ? { createdAt: { [Sequelize.Op.gt]: lastSuccess.createdAt } } : {}),
  };

  const failedAttempts = await ActivityLog.count({ where: whereCondition });

  // Get all failed attempts ordered by time (to find the Nth failure)
  const allFailed = await ActivityLog.findAll({
    where: whereCondition,
    order: [['createdAt', 'ASC']],
    attributes: ['createdAt'],
  });

  // Check tiers from highest to lowest
  for (let i = LOCKOUT_TIERS.length - 1; i >= 0; i--) {
    const tier = LOCKOUT_TIERS[i];
    if (failedAttempts >= tier.attempts) {
      // Permanent lock
      if (tier.durationMinutes === null) {
        return { locked: true, permanent: true, attempts: failedAttempts, remaining: 0 };
      }

      // Use the Nth failure (the one that triggered this tier) to calculate lockout
      // e.g., for tier at 5 attempts, use the 5th failure's timestamp
      const tierTriggerAttempt = allFailed[tier.attempts - 1];
      if (tierTriggerAttempt) {
        const lockoutExpires = new Date(tierTriggerAttempt.createdAt.getTime() + tier.durationMinutes * 60 * 1000);
        const now = new Date();

        if (now < lockoutExpires) {
          // Still locked — show remaining time
          const remainingMs = lockoutExpires - now;
          const remainingMin = Math.ceil(remainingMs / 60000);
          const remainingSec = Math.ceil(remainingMs / 1000);
          return {
            locked: true,
            permanent: false,
            attempts: failedAttempts,
            remaining: 0,
            lockoutMinutes: remainingMin,
            lockoutSeconds: remainingSec,
          };
        }

        // Lockout expired — give chances until next tier
        const nextTier = LOCKOUT_TIERS[i + 1];
        if (nextTier) {
          const remaining = nextTier.attempts - failedAttempts;
          return { locked: false, permanent: false, attempts: failedAttempts, remaining };
        }
      }
      break;
    }
  }

  // No tier hit yet — remaining until first tier
  const remaining = LOCKOUT_TIERS[0].attempts - failedAttempts;
  return { locked: false, permanent: false, attempts: failedAttempts, remaining };
};

const clearFailedAttempts = async (email) => {
  await ActivityLog.destroy({
    where: { email, type: ACTIVITY_TYPE.LOGIN_FAILED },
  });
};

const disableUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (user) {
    user.status = USER_STATUS.DISABLED;
    await user.save({ validate: false });
  }
  return user;
};

const enableUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (user) {
    user.status = USER_STATUS.ACTIVE;
    await user.save({ validate: false });
  }
  return user;
};

const logActivity = async (email, type, ipAddress = null, userId = null, role = null, metadata = null) => {
  return ActivityLog.create({
    email,
    type,
    ipAddress,
    userId,
    role,
    metadata,
  });
};

const getLastLoginTime = async (email) => {
  const { default: moment } = await import('moment');
  const lastLogin = await ActivityLog.findOne({
    where: { email, type: ACTIVITY_TYPE.LOGIN_SUCCESS },
    order: [['createdAt', 'DESC']],
    attributes: ['createdAt'],
  });
  if (!lastLogin) return null;
  return moment(lastLogin.createdAt).format('MMM DD, YYYY h:mm A');
};

export default {
  findUserByEmail,
  findUserById,
  findUserWithPassword,
  getIPRestrictionState,
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  findUserByIdForRefresh,
  updateSessionId,
  checkLoginAttempts,
  logActivity,
  clearFailedAttempts,
  disableUser,
  enableUser,
  getLastLoginTime,
};
