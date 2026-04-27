import { STATUS_CODE, Lecture, User, sendResponse, USER_ROLE } from 'scholarsync-backend-common';
import { manageLecturesSchema } from '../../model-validators/lecture-validator.js';
import { queryLectureIdSchema } from '../../model-validators/user-validator.js';
import { LECTURE_ACTIONS } from '../../constants/application-constants.js';
import studentService from '../service/student-service.js';

const getAllStudents = async (reqUser, lectureId) => {
  const { error } = queryLectureIdSchema.validate({ lectureId });
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'getAllStudents');

  if (lectureId) {
    const students = await studentService.getStudentsByClass(lectureId, reqUser.orgId);
    return sendResponse(STATUS_CODE.SUCCESS, { code: '5801', result: { count: students.length, students } }, 'getAllStudents');
  }
  const { students, message } = await studentService.getAllStudents(reqUser.role, reqUser._id, reqUser.orgId);
  return sendResponse(STATUS_CODE.SUCCESS, { code: '5801', result: { count: students.length, students, message } }, 'getAllStudents');
};

const manageLectures = async (action, lectureIds, studentIds) => {
  const { error } = manageLecturesSchema.validate({ action, lectureIds, studentIds });
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'manageLectures');

  if (action === LECTURE_ACTIONS.UNASSIGN) {
    const defaultLecture = await Lecture.findOne({ where: { isDefault: true } });
    if (!defaultLecture) return sendResponse(STATUS_CODE.INTERNALERROR, { code: '1120' }, 'manageLectures');
    if (lectureIds.includes(defaultLecture.id)) return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1132' }, 'manageLectures');
  }

  const lectureWhere = action === LECTURE_ACTIONS.ASSIGN ? { id: lectureIds, isActive: true } : { id: lectureIds };
  const lectures = await Lecture.findAll({ where: lectureWhere });
  if (lectures.length !== lectureIds.length) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: action === LECTURE_ACTIONS.ASSIGN ? '1130' : '1106' }, 'manageLectures');

  const students = await User.findAll({ where: { userId: studentIds, role: USER_ROLE.STUDENT } });
  if (students.length !== studentIds.length) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1131' }, 'manageLectures');

  if (action === LECTURE_ACTIONS.ASSIGN) {
    let totalAdded = 0, alreadyAssigned = 0;
    for (const student of students) {
      for (const lectureId of lectureIds) {
        if (!student.lectures.includes(lectureId)) { student.lectures.push(lectureId); totalAdded++; }
        else alreadyAssigned++;
      }
      await student.save();
    }
    return sendResponse(STATUS_CODE.SUCCESS, {
      code: '5106',
      result: { totalAdded, alreadyAssigned, studentsProcessed: students.length, lecturesProcessed: lectureIds.length }
    }, 'manageLectures');
  }

  let totalRemoved = 0, notInLecture = 0;
  for (const student of students) {
    const originalLength = student.lectures.length;
    student.lectures = student.lectures.filter(lid => !lectureIds.includes(lid));
    const removed = originalLength - student.lectures.length;
    totalRemoved += removed;
    notInLecture += (lectureIds.length - removed);
    await student.save();

    for (const lectureId of lectureIds) {
      await studentService.removeStudentFromLectures(student.userId, [lectureId]);
    }
  }
  return sendResponse(STATUS_CODE.SUCCESS, {
    code: '5107',
    result: { totalRemoved, notInLecture, studentsProcessed: students.length, lecturesProcessed: lectureIds.length }
  }, 'manageLectures');
};

export default { getAllStudents, manageLectures };
