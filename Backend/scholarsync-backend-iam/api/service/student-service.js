import { Sequelize } from 'sequelize';
import { User, Lecture, Attendance, AttendanceSlot, cloudinary, USER_ROLE } from 'scholarsync-backend-common';

const findStudentByEmailOrCode = async (email, userCode, orgId) => {
  return User.findOne({
    where: {
      orgId,
      [Sequelize.Op.or]: [{ email }, { userCode }],
    },
  });
};

const findStudentByCode = async (userCode, orgId) => {
  return User.findOne({ where: { userCode, orgId } });
};

const createStudent = async (data) => {
  return User.create(data);
};

const bulkCreateStudents = async (studentsData) => {
  return User.bulkCreate(studentsData);
};

const getAllStudents = async (role, userId, orgId) => {
  if (role === USER_ROLE.TEACHER) {
    const teacher = await User.findByPk(userId, { attributes: ['lectures'] });
    if (!teacher || !teacher.lectures || teacher.lectures.length === 0) {
      return { students: [] };
    }
    const students = await User.findAll({
      where: {
        role: USER_ROLE.STUDENT,
        orgId,
        lectures: { [Sequelize.Op.overlap]: teacher.lectures },
      },
      attributes: { exclude: ['password'] },
    });
    return { students };
  }
  const students = await User.findAll({
    where: { role: USER_ROLE.STUDENT, orgId },
    attributes: { exclude: ['password'] },
  });
  return { students };
};

const getStudentsByClass = async (classId, orgId) => {
  return User.findAll({
    where: {
      role: USER_ROLE.STUDENT,
      orgId,
      lectures: { [Sequelize.Op.contains]: [classId] },
    },
    attributes: { exclude: ['password'] },
    order: [['name', 'ASC']],
  });
};

const findStudentById = async (id) => {
  return User.findByPk(id);
};

const updateStudentById = async (id, updateObject) => {
  const student = await User.findByPk(id);
  if (!student) return null;
  await student.update(updateObject);
  return student;
};

const deleteStudentById = async (id) => {
  // Get all attendance records for this student
  const attendanceRecords = await Attendance.findAll({ where: { student: id } });

  // Delete photos from Cloudinary
  const photoDeletePromises = attendanceRecords.map(record => {
    if (record.photo && record.photo.public_id) {
      return cloudinary.uploader.destroy(record.photo.public_id);
    }
    return Promise.resolve();
  });
  await Promise.all(photoDeletePromises);

  // Delete attendance records
  await Attendance.destroy({ where: { student: id } });

  // Delete student
  return User.destroy({ where: { userId: id } });
};

const getDefaultLecture = async () => {
  return Lecture.findOne({ where: { isDefault: true } });
};

const getValidLectures = async (lectureIds) => {
  return Lecture.findAll({ where: { id: lectureIds, isActive: true } });
};

const getTeacherById = async (id) => {
  return User.findByPk(id, { attributes: ['lectures'] });
};

const removeStudentFromLectures = async (studentId, lectureIds) => {
  // Find attendance slots for these lectures
  const slotsInLectures = await AttendanceSlot.findAll({
    where: { lecture: lectureIds },
    attributes: ['id'],
  });
  const slotIds = slotsInLectures.map(slot => slot.id);

  // Get attendance records for this student
  const attendanceRecords = await Attendance.findAll({
    where: { student: studentId, slot: slotIds },
  });

  // Delete photos from Cloudinary
  const photoDeletePromises = attendanceRecords.map(record => {
    if (record.photo && record.photo.public_id) {
      return cloudinary.uploader.destroy(record.photo.public_id);
    }
    return Promise.resolve();
  });
  await Promise.all(photoDeletePromises);

  // Delete attendance records
  await Attendance.destroy({ where: { student: studentId, slot: slotIds } });
};

export default {
  findStudentByEmailOrCode,
  findStudentByCode,
  createStudent,
  bulkCreateStudents,
  getAllStudents,
  getStudentsByClass,
  findStudentById,
  updateStudentById,
  deleteStudentById,
  getDefaultLecture,
  getValidLectures,
  getTeacherById,
  removeStudentFromLectures
};
