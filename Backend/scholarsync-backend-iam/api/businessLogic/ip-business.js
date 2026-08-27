import { STATUS_CODE, sendResponse, REGEX_PATTERNS } from 'scholarsync-backend-common';
import { manageIPSchema } from '../../model-validators/ip-validator.js';
import { IP_ACTIONS } from '../../constants/application-constants.js';
import ipService from '../service/ip-service.js';


const manageIP = async (data, reqUser) => {
  const { error } = manageIPSchema.validate(data);
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'manageIP');

  const { action } = data;

  if (action === IP_ACTIONS.ADD) {
    const { ipAddress, locationName, description, appliesTo } = data;
    const ip = await ipService.addAllowedIP({
      ipAddress, locationName, description, appliesTo,
      isEnabled: true,
      orgId: reqUser.orgId,
      addedBy: reqUser._id,
    });
    return sendResponse(STATUS_CODE.CREATED, { code: '5301', result: ip }, 'manageIP');
  }

  if (action === IP_ACTIONS.TOGGLE) {
    const { ipId, isEnabled } = data;
    if (!REGEX_PATTERNS.UUID.test(ipId)) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1302' }, 'manageIP');

    const ip = await ipService.findAllowedIPById(ipId, reqUser.orgId);
    if (!ip) return sendResponse(STATUS_CODE.NOTFOUND, { code: '1303' }, 'manageIP');

    await ipService.toggleIP(ipId, isEnabled);
    return sendResponse(STATUS_CODE.SUCCESS, { code: '5303', result: { ipId, isEnabled } }, 'manageIP', { status: isEnabled ? 'enabled' : 'disabled' });
  }
};

const deleteIP = async (id, reqUser) => {
  if (!REGEX_PATTERNS.UUID.test(id)) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1302' }, 'deleteIP');
  }
  const ip = await ipService.findAllowedIPById(id, reqUser.orgId);
  if (!ip) return sendResponse(STATUS_CODE.NOTFOUND, { code: '1303' }, 'deleteIP');

  await ipService.deleteAllowedIPById(id);
  return sendResponse(STATUS_CODE.SUCCESS, { code: '5302' }, 'deleteIP');
};

const getIPStatus = async (reqUser) => {
  const ips = await ipService.getAllAllowedIPs(reqUser.orgId);
  return sendResponse(STATUS_CODE.SUCCESS, {
    code: '5801',
    result: { count: ips.length, ips }
  }, 'getIPStatus');
};

export default { manageIP, deleteIP, getIPStatus };
