import { User, USER_ROLE } from 'scholarsync-backend-common';

const createTeacher = async (data) => {
  return User.create(data);
};

const findTeacherByEmail = async (email) => {
  return User.findOne({ where: { email, role: USER_ROLE.TEACHER } });
};

const findTeacherByCode = async (userCode, orgId) => {
  return User.findOne({ where: { userCode, orgId, role: USER_ROLE.TEACHER } });
};

const getAllTeachers = async (orgId) => {
  return User.findAll({ where: { role: USER_ROLE.TEACHER, orgId }, attributes: { exclude: ['password'] } });
};

const findTeacherById = async (id) => {
  return User.findByPk(id, { attributes: { exclude: ['password'] } });
};

const updateTeacherById = async (id, updateObject) => {
  const teacher = await User.findByPk(id);
  if (!teacher) return null;
  await teacher.update(updateObject);
  // Re-fetch to exclude password from returned instance
  return User.findByPk(id, { attributes: { exclude: ['password'] } });
};

const deleteTeacherById = async (id) => {
  return User.destroy({ where: { userId: id } });
};

export default {
  createTeacher,
  findTeacherByEmail,
  findTeacherByCode,
  getAllTeachers,
  findTeacherById,
  updateTeacherById,
  deleteTeacherById
};
