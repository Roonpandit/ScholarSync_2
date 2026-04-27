import { STATUS_CODE, sendResponse } from 'scholarsync-backend-common';
import teacherService from '../service/teacher-service.js';

const getTeachers = async (reqUser) => {
  const teachers = await teacherService.getAllTeachers(reqUser.orgId);
  return sendResponse(STATUS_CODE.SUCCESS, { code: '5801', result: { count: teachers.length, teachers } }, 'getTeachers');
};

export default { getTeachers };
