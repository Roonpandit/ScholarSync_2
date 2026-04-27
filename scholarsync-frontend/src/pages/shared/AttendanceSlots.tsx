import { useAuth } from '@/providers/auth-context';
import AdminAttendanceSlots from '@/pages/admin/AttendanceSlots';
import TeacherAttendanceSlot from '@/pages/teacher/AttendanceSlot';

const AttendanceSlots = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return <AdminAttendanceSlots />;
  }

  return <TeacherAttendanceSlot />;
};

export default AttendanceSlots;
