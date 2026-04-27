import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

import connectDB from './config/db.js';
import { connectPG } from './config/db-pg.js';
import cloudinary from './config/cloudinary.js';

// Models (Sequelize - PostgreSQL)
import User from './models/User.js';
import Lecture from './models/Lecture.js';
import Attendance from './models/Attendance.js';
import AttendanceSlot from './models/AttendanceSlot.js';
import LeaveRequest from './models/LeaveRequest.js';
import LeaveSlot from './models/LeaveSlot.js';
import AllowedIP from './models/AllowedIP.js';
import IPSettings from './models/IPSettings.js';
import RefreshToken from './models/RefreshToken.js';
import ActivityLog from './models/LoginAttempt.js';
import DeletionLog from './models/DeletionLog.js';
import UpdateHistory from './models/UpdateHistory.js';

// Middlewares
import { protect, authorize, restrictToAdmin } from './middlewares/auth.js';
import verifyAdmin from './middlewares/admin.js';
import { initiateMiddleware } from './middlewares/initiate-middleware.js';

// Logging
import logger from './utils/logger.js';
import { getScholarSyncLog, appendToScholarSyncLog } from './utils/log-utils.js';

// Helpers
import { checkEmailExists, checkDuplicateFields } from './helpers/email-utils.js';
import { validatePassword } from './helpers/password-utils.js';
import { getErrorMessage } from './helpers/error-message-helper.js';
import { getCatchErrorMessage, logCatchError } from './helpers/catch-error-helper.js';
import { sendResponse } from './utils/response-utils.js';

// Constants
const SUCCESS = require('./constants/success-response-constants.json');
const ERRORS = require('./constants/validation-errors-constants.json');
const ERROR_CONDITIONS = require('./constants/validation-error-condition.json');
import { STATUS_CODE } from './constants/status-codes.js';
import { USER_ROLE, ACTIVITY_TYPE, USER_STATUS, ACTION_TYPE } from './constants/application-constant.js';

export {
  connectDB, connectPG,
  cloudinary,
  User, Lecture, Attendance, AttendanceSlot,
  LeaveRequest, LeaveSlot, AllowedIP, IPSettings, RefreshToken, ActivityLog, DeletionLog, UpdateHistory,
  protect, authorize, restrictToAdmin, verifyAdmin, initiateMiddleware,
  checkEmailExists, checkDuplicateFields, validatePassword, getErrorMessage, getCatchErrorMessage, logCatchError, sendResponse,
  SUCCESS, ERRORS, ERROR_CONDITIONS, STATUS_CODE, USER_ROLE, ACTIVITY_TYPE, USER_STATUS, ACTION_TYPE,
  logger, getScholarSyncLog, appendToScholarSyncLog
};
