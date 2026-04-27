import asyncHandler from 'express-async-handler';
import teacherBusiness from '../businessLogic/teacher-business.js';

const getTeachers = asyncHandler(async (req, res) => {
  const result = await teacherBusiness.getTeachers();
  res.status(result.status).json(result);
});

export default { getTeachers };
