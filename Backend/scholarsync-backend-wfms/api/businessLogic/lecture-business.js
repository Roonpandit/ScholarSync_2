import lectureService from '../service/lecture-service.js';
import { LECTURE_FILTERS } from '../../constants/application-constants.js';

// UUID validation helper
const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(id);
};

// ========================
// LECTURE CRUD OPERATIONS
// ========================

/**
 * Create a new lecture
 */
const createLecture = async ({ name, description, userId }) => {
  if (!name) {
    return { status: 400, success: false, message: 'Please provide a lecture name' };
  }

  const existingLecture = await lectureService.findLectureByName(name);
  if (existingLecture) {
    return { status: 400, success: false, message: 'A lecture with this name already exists' };
  }

  const lectureCount = await lectureService.countLectures();
  const isFirstLecture = lectureCount === 0;

  const lecture = await lectureService.createLecture({
    name,
    description: description || '',
    createdBy: userId,
    isDefault: isFirstLecture
  });

  const message = isFirstLecture
    ? 'Default lecture created successfully. This lecture cannot be deleted and all students must belong to it.'
    : 'Lecture created successfully';

  return { status: 201, success: true, message, data: lecture };
};

/**
 * Get lectures with optional filter param.
 * filter='default' returns only default lecture.
 * filter='non-default' returns student's non-default lectures.
 * No filter returns all active lectures.
 */
const getAllLectures = async (filter, user) => {
  if (filter === LECTURE_FILTERS.DEFAULT) {
    return _getDefaultLecture();
  }

  if (filter === LECTURE_FILTERS.NON_DEFAULT) {
    return _getNonDefaultLectures(user.id);
  }

  const lectures = await lectureService.getAllLectures();
  return { status: 200, success: true, count: lectures.length, data: lectures };
};

/**
 * Get single lecture by ID
 */
const getLectureById = async (id) => {
  if (!isValidUUID(id)) {
    return { status: 400, success: false, message: 'Invalid lecture ID' };
  }

  const lecture = await lectureService.findLectureByIdPopulated(id);
  if (!lecture) {
    return { status: 404, success: false, message: 'Lecture not found' };
  }

  const studentCount = await lectureService.countStudentsByLecture(id);
  const plain = lecture.toJSON ? lecture.toJSON() : lecture;

  return {
    status: 200,
    success: true,
    data: {
      ...plain,
      studentCount
    }
  };
};

/**
 * Update lecture
 */
const updateLecture = async ({ id, name, description, isActive }) => {
  if (!isValidUUID(id)) {
    return { status: 400, success: false, message: 'Invalid lecture ID' };
  }

  const lecture = await lectureService.findLectureById(id);
  if (!lecture) {
    return { status: 404, success: false, message: 'Lecture not found' };
  }

  if (name && name !== lecture.name) {
    const existingLecture = await lectureService.findLectureByNameExcluding(name, id);
    if (existingLecture) {
      return { status: 400, success: false, message: 'A lecture with this name already exists' };
    }
    lecture.name = name;
  }

  if (description !== undefined) {
    lecture.description = description;
  }

  if (isActive !== undefined && !lecture.isDefault) {
    lecture.isActive = isActive;
  }

  await lectureService.saveLecture(lecture);

  return { status: 200, success: true, message: 'Lecture updated successfully', data: lecture };
};

/**
 * Delete lecture with cascade delete of attendance + photos
 */
const deleteLecture = async (id) => {
  if (!isValidUUID(id)) {
    return { status: 400, success: false, message: 'Invalid lecture ID' };
  }

  const lecture = await lectureService.findLectureById(id);
  if (!lecture) {
    return { status: 404, success: false, message: 'Lecture not found' };
  }

  if (lecture.isDefault) {
    return { status: 403, success: false, message: 'Cannot delete the default lecture. You can only rename it.' };
  }

  await lectureService.removeStudentsFromLecture(id);

  const slotsInLecture = await lectureService.getSlotsByLecture(id);
  const slotIds = slotsInLecture.map(slot => slot.id);

  const attendanceRecords = await lectureService.getAttendanceRecordsBySlotIds(slotIds);

  const photoDeletePromises = attendanceRecords.map(record => {
    if (record.photo && record.photo.public_id) {
      return lectureService.deleteCloudinaryPhoto(record.photo.public_id);
    }
    return Promise.resolve();
  });
  await Promise.all(photoDeletePromises);

  await lectureService.deleteAttendanceBySlotIds(slotIds);
  await lectureService.deleteAttendanceSlotsByLecture(id);
  await lectureService.deleteLectureById(id);

  return {
    status: 200,
    success: true,
    message: 'Lecture deleted successfully along with all related attendance data and photos'
  };
};

/**
 * Internal: Get default lecture
 */
const _getDefaultLecture = async () => {
  const defaultLecture = await lectureService.getDefaultLecture();

  if (!defaultLecture) {
    return { status: 404, success: false, message: 'Default lecture not found. Please run the seeder to create it.' };
  }

  return { status: 200, success: true, data: defaultLecture };
};

/**
 * Get students in a specific lecture
 */
const getStudentsByLecture = async (id) => {
  if (!isValidUUID(id)) {
    return { status: 400, success: false, message: 'Invalid lecture ID' };
  }

  const lecture = await lectureService.findLectureById(id);
  if (!lecture) {
    return { status: 404, success: false, message: 'Lecture not found' };
  }

  const students = await lectureService.getStudentsByLecture(id);

  return {
    status: 200,
    success: true,
    lecture: {
      id: lecture.id,
      name: lecture.name,
      lectureId: lecture.lectureId
    },
    count: students.length,
    data: students
  };
};

/**
 * Internal: Get student's non-default lectures (for leave application)
 */
const _getNonDefaultLectures = async (studentId) => {
  const student = await lectureService.findStudentByIdPopulated(studentId);

  if (!student) {
    return { status: 404, success: false, message: 'Student not found' };
  }

  return { status: 200, success: true, data: student.lectures };
};

/**
 * Get teacher for a specific lecture
 */
const getTeacherForLecture = async (lectureId) => {
  if (!isValidUUID(lectureId)) {
    return { status: 400, success: false, message: 'Invalid lecture ID' };
  }

  const teacher = await lectureService.findTeacherByLecture(lectureId);

  if (!teacher) {
    return { status: 404, success: false, message: 'No teacher assigned to this lecture' };
  }

  return { status: 200, success: true, data: teacher };
};

export default {
  createLecture,
  getAllLectures,
  getLectureById,
  updateLecture,
  deleteLecture,
  getStudentsByLecture,
  getTeacherForLecture
};
