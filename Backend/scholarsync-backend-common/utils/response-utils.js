import { createRequire } from 'node:module';
import { getScholarSyncLog } from './log-utils.js';

const require = createRequire(import.meta.url);
const validationErrorMessages = require('../constants/validation-errors-constants.json');
const successMessages = require('../constants/success-response-constants.json');

const sendResponse = (status, data, methodName, options = {}, fieldName = null) => {
	const isError = status >= 400 && status <= 500;
	const isSuccess = status >= 200 && status < 300;

	const { code, message, result } = data;

	if (isError) {
		if (isCodeValid(code)) {
			const msg = getMessageUsingCode(true, code, options);
			return buildResponse(status, msg, code, fieldName, null);
		}
		return buildResponse(status, message, code, fieldName, null);
	}

	if (isSuccess) {
		if (isCodeValid(code)) {
			const msg = getMessageUsingCode(false, code, options);
			return buildResponse(status, msg, code, null, result);
		}
		return { status, data };
	}

	const msg = getMessageUsingCode(true, code, options);
	return buildResponse(status, msg, code, null, result);
};

const buildResponse = (status, message, code = null, fieldName = null, data = null) => {
	const response = { status, message };
	if (code) response.code = code;

	const log = getScholarSyncLog();
	if (log?.requestId) response.requestId = log.requestId;

	if (data) response.data = data;
	if (fieldName) response.fieldName = fieldName;
	return response;
};

const isCodeValid = (code) => /^\d{4}/.test(code);

const getMessageUsingCode = (isError, code, options) => {
	const messages = isError ? validationErrorMessages : successMessages;
	let messageTemplate = messages[code] || '';

	if (options && typeof options === 'object') {
		for (const key in options) {
			if (Object.hasOwn(options, key)) {
				const placeholder = `$${key}$`;
				messageTemplate = messageTemplate.replaceAll(placeholder, options[key]);
			}
		}
	}

	return messageTemplate;
};

export { sendResponse };
