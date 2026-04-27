import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, X, Edit, Trash2, Calendar, MapPin, Camera } from 'lucide-react';
import { formatDateDisplay, formatTime24h, convertToIST } from '@/utils/timeUtils';
import { toast } from 'react-toastify';
import { get, put, post, del } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';
import type { ApiResponse } from '@/types/common.types';
import Loader from '@/components/Loader';

interface LectureRef { id: string; name: string; isDefault: boolean; }
interface PhotoData { url: string; public_id?: string; }
interface LocationData { type: string; coordinates: number[]; address?: string; }
interface AttendanceRecordData {
  id: string; date: string; shift: string; status: string; type?: string;
  markedAt?: string; photo?: PhotoData; location?: LocationData;
  lecture?: { name: string }; slot?: { startTime: string; endTime: string; isClosed?: boolean };
}
interface AttendanceStatsData { totalSlots: number; pendingSlots: number; awaitingSlots: number; present: number; absent: number; }
interface StudentInfo { name: string; email: string; studentCode: string; phone?: string; lectures?: LectureRef[]; createdAt?: string; updatedAt?: string; }
interface StudentDetailsData { student: StudentInfo; attendance: { stats: AttendanceStatsData; records: AttendanceRecordData[] }; }

interface StudentDetailsProps { isModal?: boolean; studentIdProp?: string | null; onClose?: (() => void) | null; }

const StudentDetails = ({ isModal = false, studentIdProp = null, onClose = null }: StudentDetailsProps) => {
  const navigate = useNavigate();
  const { studentId: paramStudentId } = useParams<{ studentId: string }>();
  const studentId = isModal ? studentIdProp : paramStudentId;

  const [student, setStudent] = useState<StudentDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', studentCode: '', phone: '' });
  const [allLectures, setAllLectures] = useState<LectureRef[]>([]);
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [markAbsentModalOpen, setMarkAbsentModalOpen] = useState(false);
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState<AttendanceRecordData | null>(null);
  const [absentRemark, setAbsentRemark] = useState('');
  const [markingAbsent, setMarkingAbsent] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState('');
  const [approvingAttendance, setApprovingAttendance] = useState(false);
  const [rejectingAttendance, setRejectingAttendance] = useState(false);

  useEffect(() => { if (studentId) { fetchStudentDetails(); fetchAllLectures(); } }, [studentId]);

  const fetchStudentDetails = async () => {
    try { setLoading(true); const response = await get<ApiResponse<StudentDetailsData>>(API_ENDPOINTS.REPORT.STUDENT_DETAILS(studentId!)); setStudent(response?.data || null); }
    catch (error) { console.error('Error fetching student details:', error); toast.error('Failed to load student details'); }
    finally { setLoading(false); }
  };

  const fetchAllLectures = async () => {
    try { const response = await get<ApiResponse<LectureRef[]>>(API_ENDPOINTS.LECTURES.LIST); setAllLectures(response?.data || []); }
    catch (error) { console.error('Error fetching lectures:', error); toast.error('Failed to load Lectures'); setAllLectures([]); }
  };

  const handleEdit = () => {
    if (!student) return;
    setIsEditing(true);
    setSelectedLectureIds(student.student.lectures ? student.student.lectures.map(l => l.id) : []);
    setEditFormData({ name: student.student.name || '', email: student.student.email || '', studentCode: student.student.studentCode || '', phone: student.student.phone || '' });
  };

  const handleEditSubmit = async () => {
    const defaultLectureId = allLectures.find(l => l.isDefault)?.id;
    if (defaultLectureId && !selectedLectureIds.includes(defaultLectureId)) { toast.error('Student must belong to the default lecture'); return; }
    if (selectedLectureIds.length < 2) { toast.error('Please assign at least 2 Lectures (including default lecture)'); return; }
    try {
      const { name, email, studentCode, phone } = editFormData;
      const response = await put<ApiResponse & { success?: boolean }>(API_ENDPOINTS.USERS.UPDATE(studentId!), { name, email, studentCode, phone, lectures: selectedLectureIds });
      if (response?.status === 200) { toast.success('Student details updated successfully'); fetchStudentDetails(); setIsEditing(false); }
    } catch (error) { const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to update student details'); }
  };

  const handleEditCancel = () => { setIsEditing(false); setSelectedLectureIds([]); };
  const handleLectureToggle = (lectureId: string) => { setSelectedLectureIds(prev => prev.includes(lectureId) ? prev.filter(id => id !== lectureId) : [...prev, lectureId]); };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${student?.student?.name}?`)) return;
    try { await del(API_ENDPOINTS.USERS.DELETE(studentId!)); toast.success('Student deleted successfully'); if (isModal && onClose) onClose(); else navigate('/students'); }
    catch (error) { console.error('Error deleting student:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to delete student'); }
  };

  const handleCloseMarkAbsentModal = () => { setMarkAbsentModalOpen(false); setSelectedAttendanceRecord(null); setAbsentRemark(''); };

  const handleMarkAsAbsent = async () => {
    if (!absentRemark?.trim()) { toast.error('Please provide a reason for marking as absent'); return; }
    if (absentRemark.length > 1000) { toast.error('Remark must not exceed 1000 characters'); return; }
    try {
      setMarkingAbsent(true);
      const response = await post<ApiResponse & { success?: boolean }>(API_ENDPOINTS.ATTENDANCE.MARK_ABSENT(selectedAttendanceRecord!.id), { remark: absentRemark.trim() });
      if (response?.status === 200) { toast.success('Attendance marked as absent successfully. Email notification sent to student.'); handleCloseMarkAbsentModal(); fetchStudentDetails(); }
    } catch (error) { console.error('Error marking attendance as absent:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to mark attendance as absent'); }
    finally { setMarkingAbsent(false); }
  };

  const handleApproveAttendance = async () => {
    try {
      setApprovingAttendance(true);
      const response = await post<ApiResponse & { success?: boolean }>(API_ENDPOINTS.ATTENDANCE.STATUS(selectedAttendanceRecord!.id), { action: 'approve' });
      if (response?.status === 200) { toast.success('Attendance approved successfully'); setApproveModalOpen(false); setSelectedAttendanceRecord(null); fetchStudentDetails(); }
    } catch (error) { console.error('Error approving attendance:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to approve attendance'); }
    finally { setApprovingAttendance(false); }
  };

  const handleRejectAttendance = async () => {
    if (!rejectRemark?.trim()) { toast.error('Please provide a reason for rejecting attendance'); return; }
    try {
      setRejectingAttendance(true);
      const response = await post<ApiResponse & { success?: boolean }>(API_ENDPOINTS.ATTENDANCE.STATUS(selectedAttendanceRecord!.id), { action: 'reject', remark: rejectRemark.trim() });
      if (response?.status === 200) { toast.success('Attendance rejected successfully. Email sent to student.'); setRejectModalOpen(false); setSelectedAttendanceRecord(null); setRejectRemark(''); fetchStudentDetails(); }
    } catch (error) { console.error('Error rejecting attendance:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to reject attendance'); }
    finally { setRejectingAttendance(false); }
  };

  if (loading) return <Loader />;
  if (!student) return <div className="flex items-center justify-center p-8"><div className="text-lg text-gray-500">Student not found</div></div>;

  const attendanceStats = student?.attendance?.stats || { totalSlots: 0, pendingSlots: 0, awaitingSlots: 0, present: 0, absent: 0 };

  const getStatusDisplay = (record: AttendanceRecordData) => {
    const statusText = record.type ? (record.type === 'absence' ? 'Absent' : record.type === 'pending' ? 'Pending' : 'Present') : (record.status || 'Present');
    const colorClass = statusText === 'Present' ? 'bg-green-100 text-green-800' : statusText === 'Absent' ? 'bg-red-100 text-red-800' : statusText === 'Pending' ? 'bg-yellow-100 text-yellow-800' : statusText === 'awaiting_approval' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800';
    const displayText = statusText === 'awaiting_approval' ? 'Awaiting Approval' : statusText;
    return <span className={`px-2 py-1 rounded text-sm ${colorClass}`}>{displayText}</span>;
  };

  const content = (
    <div className={isModal ? '' : 'container mx-auto px-4 py-6'}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4 md:p-6 relative">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Student Details</h2>
          {!isModal && <button onClick={() => navigate(-1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors" aria-label="Close"><X size={24} /></button>}
        </div>
        <div className="p-4 md:p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4 pb-4 border-b"><div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-2xl font-medium text-blue-800">{student?.student?.name?.charAt(0) || 'S'}</span></div><div><h4 className="text-lg font-semibold text-gray-900">{student?.student?.name}</h4><p className="text-sm text-gray-500">{student?.student?.studentCode}</p></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-500 mb-1">Email</label><div className="flex items-center text-gray-900"><Mail size={16} className="mr-2 text-gray-400" />{student?.student?.email}</div></div><div><label className="block text-sm font-medium text-gray-500 mb-1">Phone</label><div className="flex items-center text-gray-900"><Phone size={16} className="mr-2 text-gray-400" />{student?.student?.phone || 'N/A'}</div></div></div>
            <div><label className="block text-sm font-medium text-gray-500 mb-2">Assigned Lectures</label>{student?.student?.lectures && student.student.lectures.length > 0 ? (<div className="flex flex-wrap gap-2">{student.student.lectures.map((lecture) => <span key={lecture.id} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${lecture.isDefault ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{lecture.name}{lecture.isDefault && ' (Default)'}</span>)}</div>) : <p className="text-gray-500 text-sm">No Lectures assigned</p>}</div>
            <div><label className="block text-sm font-medium text-gray-500 mb-2">Attendance Overview</label><div className="grid grid-cols-1 sm:grid-cols-5 gap-4"><div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-gray-500">Total Slots</h3><p className="text-2xl font-bold text-gray-900">{attendanceStats.totalSlots}</p></div><div className="bg-yellow-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-yellow-600">Pending</h3><p className="text-2xl font-bold text-yellow-600">{attendanceStats.pendingSlots}</p></div><div className="bg-orange-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-orange-600">Awaiting Approval</h3><p className="text-2xl font-bold text-orange-600">{attendanceStats.awaitingSlots}</p></div><div className="bg-green-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-green-600">Present</h3><p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p></div><div className="bg-red-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-red-600">Absent</h3><p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p></div></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-500 mb-1">Created At</label><div className="flex items-center text-gray-900 text-sm"><Calendar size={16} className="mr-2 text-gray-400" />{student?.student?.createdAt ? new Date(student.student.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div></div><div><label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label><div className="text-gray-900 text-sm">{student?.student?.updatedAt ? new Date(student.student.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div></div></div>
          </div>
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"><Edit className="w-4 h-4 mr-2" />Edit</button>
            <button onClick={() => setShowAttendance(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"><Calendar className="w-4 h-4 mr-2" />Attendance</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"><Trash2 className="w-4 h-4 mr-2" />Delete</button>
          </div>
        </div>
      </div>
    </div>
  );

  const editModal = isEditing && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleEditCancel}></div>
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Student Details</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Student Code</label><input type="text" value={editFormData.studentCode} onChange={(e) => setEditFormData({ ...editFormData, studentCode: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Assign Lectures <span className="text-red-500">*</span><span className="text-gray-500 text-xs ml-2">(Minimum 2 Lectures including default)</span></label><div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">{allLectures.map((lecture) => (<div key={lecture.id} className="flex items-center"><input type="checkbox" id={`lecture-${lecture.id}`} checked={selectedLectureIds.includes(lecture.id)} onChange={() => handleLectureToggle(lecture.id)} disabled={lecture.isDefault} className="mr-2" /><label htmlFor={`lecture-${lecture.id}`} className="cursor-pointer">{lecture.name}{lecture.isDefault && <span className="ml-2 text-xs text-yellow-600">(Default - Required)</span>}</label></div>))}</div>{selectedLectureIds.length < 2 && <p className="text-red-500 text-xs mt-1">Please assign at least 2 Lectures</p>}</div>
          <div className="flex justify-end space-x-3"><button onClick={handleEditCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button><button onClick={handleEditSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update</button></div>
        </div>
      </div>
    </div>
  );

  const attendanceModal = showAttendance && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowAttendance(false)}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-[1200px] max-h-[90vh] overflow-y-auto p-6" style={{ marginTop: 20 }}>
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-medium text-gray-900">Attendance History</h3><button onClick={() => setShowAttendance(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button></div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm"><h3 className="text-lg font-semibold text-gray-700">Total Slots</h3><p className="text-2xl font-bold">{attendanceStats.totalSlots}</p></div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow-sm"><h3 className="text-lg font-semibold text-yellow-600">Pending</h3><p className="text-2xl font-bold text-yellow-600">{attendanceStats.pendingSlots}</p></div>
            <div className="bg-orange-50 p-4 rounded-lg shadow-sm"><h3 className="text-lg font-semibold text-orange-600">Awaiting Approval</h3><p className="text-2xl font-bold text-orange-600">{attendanceStats.awaitingSlots}</p></div>
            <div className="bg-green-50 p-4 rounded-lg shadow-sm"><h3 className="text-lg font-semibold text-green-600">Present</h3><p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p></div>
            <div className="bg-red-50 p-4 rounded-lg shadow-sm"><h3 className="text-lg font-semibold text-red-600">Absent</h3><p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lecture</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked At</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(student?.attendance?.records || []).map((record) => {
                  const statusText = record.type ? (record.type === 'absence' ? 'Absent' : record.type === 'pending' ? 'Pending' : 'Present') : (record.status || 'Present');
                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-3 text-sm">{formatDateDisplay(convertToIST(new Date(record.date)))}</td>
                      <td className="px-4 py-3 text-sm">{record.lecture?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{record.shift?.charAt(0)?.toUpperCase() + record.shift?.slice(1)}</td>
                      <td className="px-4 py-3 text-sm">{getStatusDisplay(record)}</td>
                      <td className="px-4 py-3 text-sm">{record.markedAt ? formatTime24h(new Date(record.markedAt)) : ''}</td>
                      <td className="px-4 py-3 text-sm"><button className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100" onClick={() => toast.info(`Location: ${record.location?.coordinates?.join(', ')}`)}><MapPin className="w-3 h-3 mr-1" />View</button></td>
                      <td className="px-4 py-3 text-sm"><button className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100" onClick={() => { setSelectedPhoto(record.photo?.url || null); setPhotoModalOpen(true); }}><Camera className="w-3 h-3 mr-1" />View</button></td>
                      <td className="px-4 py-3 text-sm">
                        {statusText === 'awaiting_approval' && !record.slot?.isClosed && (
                          <div className="flex items-center gap-2">
                            <button className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700" onClick={() => { setSelectedAttendanceRecord(record); setApproveModalOpen(true); }}>Approve</button>
                            <button className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700" onClick={() => { setSelectedAttendanceRecord(record); setRejectRemark(''); setRejectModalOpen(true); }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const photoModal = photoModalOpen && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setPhotoModalOpen(false)}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"><h3 className="text-lg font-medium mb-4">Attendance Photo</h3>{selectedPhoto ? <img src={selectedPhoto} alt="Attendance" className="w-full max-h-[80vh] object-contain" /> : <div className="text-center text-gray-500 py-8"><Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" /><p>No photo available</p></div>}<button onClick={() => setPhotoModalOpen(false)} className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 w-full">Close</button></div>
    </div>
  );

  const markAbsentModal = markAbsentModalOpen && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCloseMarkAbsentModal}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-medium mb-4">Mark Attendance as Absent</h3>
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded"><p className="text-sm text-yellow-800"><strong>Warning:</strong> You are about to mark this student&apos;s attendance as absent. The student will receive an email notification with your reason.</p></div>
        <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Reason for Marking Absent <span className="text-red-500">*</span></label><textarea value={absentRemark} onChange={(e) => setAbsentRemark(e.target.value)} placeholder="Enter the reason (max 1000 characters)" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" rows={5} maxLength={1000} /><div className="text-xs text-gray-500 mt-1">{absentRemark.length} / 1000 characters</div></div>
        <div className="flex justify-end space-x-3"><button onClick={handleCloseMarkAbsentModal} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" disabled={markingAbsent}>Cancel</button><button onClick={handleMarkAsAbsent} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={markingAbsent || !absentRemark.trim()}>{markingAbsent ? 'Marking Absent...' : 'Mark as Absent & Send Email'}</button></div>
      </div>
    </div>
  );

  const approveModal = approveModalOpen && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => { setApproveModalOpen(false); setSelectedAttendanceRecord(null); }}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-medium mb-4">Approve Attendance</h3>
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded"><p className="text-sm text-green-800"><strong>Confirmation:</strong> You are about to approve this student&apos;s attendance.</p></div>
        <div className="flex justify-end space-x-3"><button onClick={() => { setApproveModalOpen(false); setSelectedAttendanceRecord(null); }} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" disabled={approvingAttendance}>Cancel</button><button onClick={handleApproveAttendance} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50" disabled={approvingAttendance}>{approvingAttendance ? 'Approving...' : 'Approve Attendance'}</button></div>
      </div>
    </div>
  );

  const rejectModal = rejectModalOpen && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => { setRejectModalOpen(false); setSelectedAttendanceRecord(null); setRejectRemark(''); }}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-medium mb-4">Reject Attendance</h3>
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded"><p className="text-sm text-red-800"><strong>Warning:</strong> You are about to reject this student&apos;s attendance.</p></div>
        <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejecting <span className="text-red-500">*</span></label><textarea value={rejectRemark} onChange={(e) => setRejectRemark(e.target.value)} placeholder="Enter the reason" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" rows={5} maxLength={1000} /><div className="text-xs text-gray-500 mt-1">{rejectRemark.length} / 1000 characters</div></div>
        <div className="flex justify-end space-x-3"><button onClick={() => { setRejectModalOpen(false); setSelectedAttendanceRecord(null); setRejectRemark(''); }} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" disabled={rejectingAttendance}>Cancel</button><button onClick={handleRejectAttendance} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50" disabled={rejectingAttendance || !rejectRemark.trim()}>{rejectingAttendance ? 'Rejecting...' : 'Reject & Send Email'}</button></div>
      </div>
    </div>
  );

  if (isModal) {
    return (<>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose || undefined}></div><div className="relative bg-white rounded-lg shadow-xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto" style={{ marginTop: 20 }}>{content}</div></div>
      {editModal}{attendanceModal}{photoModal}{markAbsentModal}{approveModal}{rejectModal}
    </>);
  }

  return <>{content}{editModal}{attendanceModal}{photoModal}{markAbsentModal}{approveModal}{rejectModal}</>;
};

export default StudentDetails;
