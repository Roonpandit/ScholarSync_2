import { Sequelize } from 'sequelize';
import {
  Student,
  Teacher,
  Lecture,
  AttendanceSlot,
  Attendance,
  cloudinary
} from 'scholarsync-backend-common';

const { Op } = Sequelize;

// ========================
// LECTURE OPERATIONS
// ========================

const createLecture = async (data) => {
  return Lecture.create(data);
};

const findLectureById = async (id) => {
  return Lecture.findByPk(id);
};

const findLectureByIdPopulated = async (id) => {
  // No populate — return raw lecture
  return Lecture.findByPk(id);
};

const findLectureByName = async (name) => {
  return Lecture.findOne({ where: { name } });
};

const findLectureByNameExcluding = async (name, excludeId) => {
  return Lecture.findOne({
    where: {
      name,
      id: { [Op.ne]: excludeId }
    }
  });
};

const countLectures = async () => {
  return Lecture.count();
};

const getAllLectures = async () => {
  return Lecture.findAll({
    where: { isActive: true },
    order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
  });
};

const saveLecture = async (lecture) => {
  return lecture.save();
};

const deleteLectureById = async (id) => {
  return Lecture.destroy({ where: { id } });
};

const getDefaultLecture = async () => {
  return Lecture.findOne({ where: { isDefault: true } });
};

// ========================
// STUDENT OPERATIONS
// ========================

const countStudentsByLecture = async (lectureId) => {
  return Student.count({
    where: {
      lectures: { [Op.contains]: [lectureId] }
    }
  });
};

const getStudentsByLecture = async (lectureId) => {
  return Student.findAll({
    where: {
      lectures: { [Op.contains]: [lectureId] }
    },
    attributes: ['id', 'name', 'email', 'studentCode', 'phone', 'createdAt'],
    order: [['name', 'ASC']]
  });
};

const findStudentByIdPopulated = async (studentId) => {
  // lectures is ARRAY(UUID) in Sequelize. Get student, then fetch non-default active lectures.
  const student = await Student.findByPk(studentId, { raw: true });
  if (!student || !student.lectures || student.lectures.length === 0) {
    return student ? { ...student, lectures: [] } : null;
  }

  const lectureRecords = await Lecture.findAll({
    where: {
      id: student.lectures,
      isDefault: false,
      isActive: true
    }
  });

  return { ...student, lectures: lectureRecords };
};

const removeStudentsFromLecture = async (lectureId) => {
  // Find all students that have this lecture, then remove it from the array
  const students = await Student.findAll({
    where: {
      lectures: { [Op.contains]: [lectureId] }
    }
  });

  const updatePromises = students.map(student => {
    const updatedLectures = student.lectures.filter(id => id !== lectureId);
    return student.update({ lectures: updatedLectures });
  });

  return Promise.all(updatePromises);
};

// ========================
// TEACHER OPERATIONS
// ========================

const findTeacherByLecture = async (lectureId) => {
  return Teacher.findOne({
    where: {
      lectures: { [Op.contains]: [lectureId] }
    },
    attributes: ['id', 'name', 'teacherCode', 'email']
  });
};

// ========================
// ATTENDANCE CLEANUP
// ========================

const getSlotsByLecture = async (lectureId) => {
  return AttendanceSlot.findAll({
    where: { lectureId },
    attributes: ['id']
  });
};

const getAttendanceRecordsBySlotIds = async (slotIds) => {
  return Attendance.findAll({ where: { slotId: slotIds } });
};

const deleteAttendanceBySlotIds = async (slotIds) => {
  return Attendance.destroy({ where: { slotId: slotIds } });
};

const deleteAttendanceSlotsByLecture = async (lectureId) => {
  return AttendanceSlot.destroy({ where: { lectureId } });
};

const deleteCloudinaryPhoto = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export default {
  // Lecture operations
  createLecture,
  findLectureById,
  findLectureByIdPopulated,
  findLectureByName,
  findLectureByNameExcluding,
  countLectures,
  getAllLectures,
  saveLecture,
  deleteLectureById,
  getDefaultLecture,

  // Student operations
  countStudentsByLecture,
  getStudentsByLecture,
  findStudentByIdPopulated,
  removeStudentsFromLecture,

  // Teacher operations
  findTeacherByLecture,

  // Attendance cleanup
  getSlotsByLecture,
  getAttendanceRecordsBySlotIds,
  deleteAttendanceBySlotIds,
  deleteAttendanceSlotsByLecture,
  deleteCloudinaryPhoto
};
