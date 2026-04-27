import { useAuth } from '@/providers/auth-context';
import AdminLeaveManagement from '@/pages/admin/LeaveManagement';
import TeacherLeaveManagement from '@/pages/teacher/LeaveManagement';

const LeaveManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return <AdminLeaveManagement />;
  }

  return <TeacherLeaveManagement />;
};

export default LeaveManagement;
