import { AllowedIP, IPSettings } from 'scholarsync-backend-common';

const addAllowedIP = async (data) => {
  return AllowedIP.create(data);
};

const findAllowedIPById = async (id) => {
  return AllowedIP.findByPk(id);
};

const deleteAllowedIPById = async (id) => {
  return AllowedIP.destroy({ where: { id } });
};

const getAllAllowedIPs = async () => {
  return AllowedIP.findAll({ order: [['createdAt', 'DESC']] });
};

const getIPSettings = async () => {
  return IPSettings.findOne();
};

const updateIPSettings = async (isEnabled, adminId) => {
  let settings = await IPSettings.findOne();
  if (settings) {
    settings.isEnabled = isEnabled;
    settings.updatedBy = adminId;
    await settings.save();
    return settings;
  }
  return IPSettings.create({ isEnabled, updatedBy: adminId });
};

export default {
  addAllowedIP,
  findAllowedIPById,
  deleteAllowedIPById,
  getAllAllowedIPs,
  getIPSettings,
  updateIPSettings
};
