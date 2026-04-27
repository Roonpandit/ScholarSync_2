import asyncHandler from 'express-async-handler';
import studentBusiness from '../businessLogic/student-business.js';

const getAllStudents = asyncHandler(async (req, res) => {
  const result = await studentBusiness.getAllStudents(req.user, req.query.lectureId);
  res.status(result.status).json(result);
});

const manageLectures = asyncHandler(async (req, res) => {
  const result = await studentBusiness.manageLectures(req.body.action, req.body.lectureIds, req.body.studentIds);
  res.status(result.status).json(result);
});

export default { getAllStudents, manageLectures };
