import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { get, put, del } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';
import type { ApiResponse } from '@/types/common.types';
import Loader from '@/components/Loader';

interface LectureRef { id: string; name: string; isDefault: boolean; }
interface TeacherData {
  id: string; name: string; email: string; teacherCode: string; phone?: string;
  lectures?: Array<LectureRef | string>;
  createdAt?: string; updatedAt?: string;
}

interface TeacherDetailsProps {
  isModal?: boolean;
  teacherIdProp?: string | null;
  teacherDataProp?: TeacherData | null;
  onClose?: (() => void) | null;
}

const TeacherDetails = ({ isModal = false, teacherIdProp = null, teacherDataProp = null, onClose = null }: TeacherDetailsProps) => {
  const navigate = useNavigate();
  const { teacherId: paramTeacherId } = useParams<{ teacherId: string }>();
  const teacherId = isModal ? teacherIdProp : paramTeacherId;

  const [teacher, setTeacher] = useState<TeacherData | null>(teacherDataProp);
  const [loading, setLoading] = useState(!teacherDataProp);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', teacherCode: '', phone: '' });
  const [allLectures, setAllLectures] = useState<LectureRef[]>([]);
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);

  useEffect(() => {
    if (!teacherDataProp && teacherId) fetchTeacherDetails();
    fetchAllLectures();
  }, [teacherId, teacherDataProp]);

  const fetchAllLectures = async () => {
    try {
      const response = await get<ApiResponse<LectureRef[]>>(API_ENDPOINTS.LECTURES.LIST);
      const lecturesData = response?.data || [];
      setAllLectures(lecturesData.filter((lecture: LectureRef) => !lecture.isDefault));
    } catch (error) { console.error('Error fetching lectures:', error); toast.error('Failed to load lectures'); setAllLectures([]); }
  };

  const fetchTeacherDetails = async () => {
    try {
      setLoading(true);
      const response = await get<ApiResponse<TeacherData>>(API_ENDPOINTS.USERS.GET(teacherId!));
      setTeacher(response?.data || null);
    } catch (error) { console.error('Error fetching teacher details:', error); toast.error('Failed to load teacher details'); } finally { setLoading(false); }
  };

  const handleEdit = () => {
    if (!teacher) return;
    setIsEditing(true);
    const teacherLectureIds = teacher.lectures ? teacher.lectures.map(l => typeof l === 'string' ? l : l.id) : [];
    setSelectedLectureIds(teacherLectureIds);
    setEditFormData({ name: teacher.name, email: teacher.email, teacherCode: teacher.teacherCode, phone: teacher.phone || '' });
  };

  const handleEditSubmit = async () => {
    if (selectedLectureIds.length === 0) { toast.error('Please assign at least one lecture to the teacher'); return; }
    try {
      const { name, email, teacherCode, phone } = editFormData;
      const response = await put<ApiResponse & { success?: boolean }>(API_ENDPOINTS.USERS.UPDATE(teacherId || teacher?.id || ''), { name, email, teacherCode, phone, lectures: selectedLectureIds });
      if (response?.status === 200) {
        toast.success('Teacher details updated successfully');
        if (!isModal && !teacherDataProp) { fetchTeacherDetails(); }
        else { const updatedLectures = allLectures.filter(l => selectedLectureIds.includes(l.id)); setTeacher({ ...teacher!, name, email, teacherCode, phone, lectures: updatedLectures }); }
        setIsEditing(false);
      }
    } catch (error) { const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to update teacher details'); }
  };

  const handleEditCancel = () => { setIsEditing(false); setSelectedLectureIds([]); setEditFormData({ name: '', email: '', teacherCode: '', phone: '' }); };

  const handleLectureToggle = (lectureId: string) => { setSelectedLectureIds(prev => prev.includes(lectureId) ? prev.filter(id => id !== lectureId) : [...prev, lectureId]); };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${teacher?.name}?`)) return;
    try {
      await del(API_ENDPOINTS.USERS.DELETE(teacherId || teacher?.id || ''));
      toast.success('Teacher deleted successfully');
      if (isModal && onClose) onClose(); else navigate('/teachers');
    } catch (error) { console.error('Error deleting teacher:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to delete teacher'); }
  };

  if (loading) return <Loader />;
  if (!teacher) return <div className="flex items-center justify-center p-8"><div className="text-lg text-gray-500">Teacher not found</div></div>;

  const content = (
    <div className={isModal ? '' : 'container mx-auto px-4 py-6'}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4 md:p-6 relative">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Teacher Details</h2>
          {!isModal && <button onClick={() => navigate(-1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors" aria-label="Close"><X size={24} /></button>}
        </div>
        <div className="p-4 md:p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4 pb-4 border-b"><div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-2xl font-medium text-blue-800">{teacher.name.charAt(0)}</span></div><div><h4 className="text-lg font-semibold text-gray-900">{teacher.name}</h4><p className="text-sm text-gray-500">{teacher.teacherCode}</p></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-500 mb-1">Email</label><div className="flex items-center text-gray-900"><Mail size={16} className="mr-2 text-gray-400" />{teacher.email}</div></div><div><label className="block text-sm font-medium text-gray-500 mb-1">Phone</label><div className="text-gray-900">{teacher.phone || 'N/A'}</div></div></div>
            <div><label className="block text-sm font-medium text-gray-500 mb-2">Assigned Lectures</label>{teacher.lectures && teacher.lectures.length > 0 ? (<div className="flex flex-wrap gap-2">{teacher.lectures.map((lecture) => { const key = typeof lecture === 'string' ? lecture : lecture.id; const name = typeof lecture === 'string' ? lecture : lecture.name; return <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">{name}</span>; })}</div>) : <p className="text-gray-500 text-sm">No lectures assigned</p>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-500 mb-1">Created At</label><div className="text-gray-900 text-sm">{teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div></div><div><label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label><div className="text-gray-900 text-sm">{teacher.updatedAt ? new Date(teacher.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div></div></div>
          </div>
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"><Edit className="w-4 h-4 mr-2" />Edit</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"><Trash2 className="w-4 h-4 mr-2" />Delete</button>
          </div>
        </div>
      </div>
    </div>
  );

  const editModal = isEditing && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleEditCancel}></div>
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Teacher Details</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter teacher's full name" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="teacher@example.com" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Teacher Code</label><input type="text" value={editFormData.teacherCode} onChange={(e) => setEditFormData({ ...editFormData, teacherCode: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="e.g. TCH12345" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter 10-digit phone number" /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Assign Lectures <span className="text-red-500">*</span></label><div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">{allLectures.map((lecture) => (<div key={lecture.id} className="flex items-center"><input type="checkbox" id={`lecture-${lecture.id}`} checked={selectedLectureIds.includes(lecture.id)} onChange={() => handleLectureToggle(lecture.id)} className="mr-2" /><label htmlFor={`lecture-${lecture.id}`} className="cursor-pointer">{lecture.name}</label></div>))}</div>{selectedLectureIds.length === 0 && <p className="text-red-500 text-xs mt-1">Please assign at least one lecture</p>}</div>
          <div className="flex justify-end space-x-3"><button onClick={handleEditCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button><button onClick={handleEditSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update</button></div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose || undefined}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto" style={{ marginTop: 20 }}>{content}</div>
        </div>
        {editModal}
      </>
    );
  }

  return <>{content}{editModal}</>;
};

export default TeacherDetails;
