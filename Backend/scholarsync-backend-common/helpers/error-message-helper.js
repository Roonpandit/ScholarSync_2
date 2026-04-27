import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const validationErrorMessages = require('../constants/validation-errors-constants.json');

const getErrorMessage = (errorCode, options = {}, fieldName = 'unknownField') => {
	const errorMessageTemplate = validationErrorMessages[errorCode];

	if (!errorMessageTemplate) {
		return `No message found for error code: ${errorCode}`;
	}

	if (!options || Object.keys(options).length === 0) {
		return `Joi:${errorCode}:${errorMessageTemplate}:${fieldName}`;
	}

	let errorMessage = errorMessageTemplate;

	for (const key in options) {
		if (Object.hasOwn(options, key)) {
			const placeholder = `$${key}$`;
			errorMessage = errorMessage.replaceAll(placeholder, options[key]);
		}
	}

	return `Joi:${errorCode}:${errorMessage}:${fieldName}`;
};

export { getErrorMessage };
