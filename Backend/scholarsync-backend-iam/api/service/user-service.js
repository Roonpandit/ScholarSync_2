import { User, Attendance, cloudinary, USER_ROLE } from 'scholarsync-backend-common';

const findUserById = async (id) => {
  const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
  if (user) return { user, role: user.role };
  return { user: null, role: null };
};

const findUserByIdWithPassword = async (id) => {
  const user = await User.findByPk(id);
  if (user) return { user, role: user.role };
  return { user: null, role: null };
};

const deleteUserById = async (id, role) => {
  if (role === USER_ROLE.STUDENT) {
    // Clean up attendance records + Cloudinary photos
    const attendanceRecords = await Attendance.findAll({ where: { student: id } });
    const photoDeletePromises = attendanceRecords.map(record => {
      if (record.photo && record.photo.public_id) {
        return cloudinary.uploader.destroy(record.photo.public_id);
      }
      return Promise.resolve();
    });
    await Promise.all(photoDeletePromises);
    await Attendance.destroy({ where: { student: id } });
  }
  return User.destroy({ where: { userId: id } });
};

export default { findUserById, findUserByIdWithPassword, deleteUserById };
