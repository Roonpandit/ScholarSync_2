import { STATUS_CODE, sendResponse } from 'scholarsync-backend-common';
import { manageIPSchema } from '../../model-validators/ip-validator.js';
import { IP_ACTIONS } from '../../constants/application-constants.js';
import ipService from '../service/ip-service.js';

const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

const manageIP = async (data, adminId) => {
  const { error } = manageIPSchema.validate(data);
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'manageIP');

  const { action } = data;

  if (action === IP_ACTIONS.ADD) {
    const { ipAddress, locationName, description } = data;
    const ip = await ipService.addAllowedIP({ ipAddress, locationName, description, addedBy: adminId });
    return sendResponse(STATUS_CODE.CREATED, { code: '5301', result: ip }, 'manageIP');
  }

  if (action === IP_ACTIONS.TOGGLE) {
    const { isEnabled } = data;
    const settings = await ipService.updateIPSettings(isEnabled, adminId);
    return sendResponse(STATUS_CODE.SUCCESS, { code: '5303', result: settings }, 'manageIP', { status: isEnabled ? 'enabled' : 'disabled' });
  }
};

const deleteIP = async (id) => {
  if (!isValidUUID(id)) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1302' }, 'deleteIP');
  }
  const ip = await ipService.findAllowedIPById(id);
  if (!ip) return sendResponse(STATUS_CODE.NOTFOUND, { code: '1303' }, 'deleteIP');

  await ipService.deleteAllowedIPById(id);
  return sendResponse(STATUS_CODE.SUCCESS, { code: '5302' }, 'deleteIP');
};

// Merged: returns both IP list and restriction status
const getIPStatus = async () => {
  const settings = await ipService.getIPSettings();
  const ips = await ipService.getAllAllowedIPs();
  return sendResponse(STATUS_CODE.SUCCESS, {
    code: '5801',
    result: { isEnabled: settings ? settings.isEnabled : false, count: ips.length, ips }
  }, 'getIPStatus');
};

export default { manageIP, deleteIP, getIPStatus };
