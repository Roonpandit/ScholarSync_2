import { uuidv7 } from 'uuidv7';

const prefixMap = {
  default: 'ss',
  scholarSyncRequestId: 'sr',
  scholarSyncGroupId: 'sg',
};

const generateCustomUuid = (actionModule = 'default') => {
  const prefix = prefixMap[actionModule] || 'ss';
  const uuid = uuidv7();
  return `${prefix}${uuid.slice(2)}`.toLowerCase();
};

export { generateCustomUuid };
