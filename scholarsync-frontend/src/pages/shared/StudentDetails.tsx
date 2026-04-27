import { useAuth } from '@/providers/auth-context';
import AdminStudentDetails from '@/pages/admin/StudentDetails';
import TeacherStudentDetail from '@/pages/teacher/StudentDetail';

interface StudentDetailsProps {
  isModal?: boolean;
  studentIdProp?: string | null;
  onClose?: (() => void) | null;
}

const StudentDetails = ({ isModal = false, studentIdProp = null, onClose = null }: StudentDetailsProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return <AdminStudentDetails isModal={isModal} studentIdProp={studentIdProp} onClose={onClose} />;
  }

  return <TeacherStudentDetail isModal={isModal} studentIdProp={studentIdProp} onClose={onClose} />;
};

export default StudentDetails;
