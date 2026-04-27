import { useAuth } from '@/providers/auth-context';
import AdminAttendanceStats from '@/pages/admin/AttendanceStats';
import TeacherAttendanceStat from '@/pages/teacher/AttendanceStat';

const AttendanceStats = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return <AdminAttendanceStats />;
  }

  return <TeacherAttendanceStat />;
};

export default AttendanceStats;
