import User from '../models/User.js';

const checkEmailExists = async (email) => {
  const emailLower = email.toLowerCase();
  const user = await User.findOne({ where: { email: emailLower } });
  if (user) return { exists: true, userType: user.role };
  return { exists: false, userType: null };
};

const checkDuplicateFields = async ({ email, mobile, userCode, orgId }) => {
  if (email) {
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) return { field: 'Email', userType: existing.role };
  }
  if (mobile) {
    const existing = await User.findOne({ where: { mobile } });
    if (existing) return { field: 'Mobile', userType: existing.role };
  }
  if (userCode && orgId) {
    const existing = await User.findOne({ where: { userCode, orgId } });
    if (existing) return { field: 'User code', userType: existing.role };
  }
  return null;
};

export { checkEmailExists, checkDuplicateFields };
