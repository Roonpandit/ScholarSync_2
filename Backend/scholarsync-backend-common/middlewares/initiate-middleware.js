import { namespace } from '../utils/cls-namespace.js';
import { setScholarSyncLog, setRequestData } from '../utils/log-utils.js';
import { generateCustomUuid } from '../utils/uuid-utils.js';
import logger from '../utils/logger.js';

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip;
};

const initiateMiddleware = (options = {}) => (req, res, next) => {
  const scholarSyncLog = {
    requestId: req.headers['x-scholarsync-request-id'] || generateCustomUuid('scholarSyncRequestId'),
    groupId: req.headers['x-scholarsync-group-id'] || generateCustomUuid('scholarSyncGroupId'),
    service: options.service || 'UNKNOWN',
    url: req.originalUrl,
    method: req.method,
    env: process.env.NODE_ENV || 'UNKNOWN',
    clientIP: getClientIP(req),
    userAgent: req.headers['user-agent'] || 'UNKNOWN',
    timestamp: new Date().toISOString(),
  };

  // Set response headers for traceability
  req.headers['x-scholarsync-group-id'] = scholarSyncLog.groupId;
  res.set('x-scholarsync-request-id', scholarSyncLog.requestId);
  res.set('x-scholarsync-group-id', scholarSyncLog.groupId);

  req.scholarSyncLog = scholarSyncLog;

  // Log incoming request
  logger.debug({
    message: 'Incoming request',
    ...scholarSyncLog,
    logType: 'incomingRequest',
  });

  // Track response time
  const startTime = Date.now();
  res.locals.startTime = startTime;

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.debug({
      message: 'Response sent',
      ...scholarSyncLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      logType: 'responseSent',
    });
  });

  // Run in CLS namespace
  namespace.run(() => {
    setScholarSyncLog(scholarSyncLog);
    setRequestData(req);
    next();
  });
};

export { initiateMiddleware };
