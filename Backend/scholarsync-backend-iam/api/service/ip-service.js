import { AllowedIP } from 'scholarsync-backend-common';

const addAllowedIP = async (data) => {
  return AllowedIP.create(data);
};

const findAllowedIPById = async (ipId, orgId) => {
  return AllowedIP.findOne({ where: { ipId, orgId } });
};

const deleteAllowedIPById = async (ipId) => {
  return AllowedIP.destroy({ where: { ipId } });
};

const toggleIP = async (ipId, isEnabled) => {
  return AllowedIP.update({ isEnabled }, { where: { ipId } });
};

const getAllAllowedIPs = async (orgId) => {
  return AllowedIP.findAll({ where: { orgId }, order: [['created_at', 'DESC']] });
};

export default {
  addAllowedIP,
  findAllowedIPById,
  deleteAllowedIPById,
  toggleIP,
  getAllAllowedIPs,
};
