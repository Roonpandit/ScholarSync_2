import logger from '../utils/logger.js';
import { getScholarSyncLog, getRequestData } from '../utils/log-utils.js';
import { sendResponse } from '../utils/response-utils.js';
import { STATUS_CODE } from '../constants/status-codes.js';

const logCatchError = (functionName, error) => {
  const scholarSyncLog = getScholarSyncLog();
  const requestData = getRequestData();

  logger.error(`Error in ${functionName}`, {
    methodName: functionName,
    error: error?.message || error,
    stack: error?.stack,
    requestData,
    scholarSyncLog,
    logType: 'internalCatchError',
  });
};

const getCatchErrorMessage = (functionName, error) => {
  logCatchError(functionName, error);
  return sendResponse(STATUS_CODE.INTERNALERROR, { code: '1027' }, functionName);
};

export { getCatchErrorMessage, logCatchError };
