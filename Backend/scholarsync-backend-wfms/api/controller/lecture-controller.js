import asyncHandler from 'express-async-handler';
import lectureBusiness from '../businessLogic/lecture-business.js';

const createLecture = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const result = await lectureBusiness.createLecture({ name, description, userId: req.user.id });
  res.status(result.status).json(result);
});

const getAllLectures = asyncHandler(async (req, res) => {
  const result = await lectureBusiness.getAllLectures(req.query.filter, req.user);
  res.status(result.status).json(result);
});

const getLectureById = asyncHandler(async (req, res) => {
  const result = await lectureBusiness.getLectureById(req.params.id);
  res.status(result.status).json(result);
});

const updateLecture = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;
  const result = await lectureBusiness.updateLecture({ id: req.params.id, name, description, isActive });
  res.status(result.status).json(result);
});

const deleteLecture = asyncHandler(async (req, res) => {
  const result = await lectureBusiness.deleteLecture(req.params.id);
  res.status(result.status).json(result);
});

const getStudentsByLecture = asyncHandler(async (req, res) => {
  const result = await lectureBusiness.getStudentsByLecture(req.params.id);
  res.status(result.status).json(result);
});

const getTeacherForLecture = asyncHandler(async (req, res) => {
  const result = await lectureBusiness.getTeacherForLecture(req.params.lectureId);
  res.status(result.status).json(result);
});

export default {
  createLecture,
  getAllLectures,
  getLectureById,
  updateLecture,
  deleteLecture,
  getStudentsByLecture,
  getTeacherForLecture
};
