import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import { Users, Plus, X, Mail, UserCheck, Search, Edit, Trash2, Eye } from 'lucide-react';
import { get, post, put, del } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';
import type { ApiResponse } from '@/types/common.types';
import Loader from '@/components/Loader';

interface LectureRef { id: string; name: string; isDefault: boolean; }
interface Teacher {
  id: string; name: string; email: string; teacherCode: string; phone?: string;
  lectures?: Array<LectureRef | string>;
  createdAt?: string; updatedAt?: string;
}

interface FormData { name: string; email: string; teacherCode: string; phone: string; lectures: string[]; }

const TeacherManagements = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [lectures, setLectures] = useState<LectureRef[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const generatePassword = (name: string): string => {
    const firstName = name.split(' ')[0];
    return `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}@123`;
  };

  const [formData, setFormData] = useState<FormData>({ name: '', email: '', teacherCode: '', phone: '', lectures: [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) errs.email = 'Invalid email address';
    if (!formData.teacherCode.trim()) errs.teacherCode = 'Teacher code is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[0-9]{10}$/.test(formData.phone)) errs.phone = 'Please enter a valid 10-digit phone number';
    if (!formData.lectures || formData.lectures.length === 0) errs.lectures = 'Please assign at least one lecture to the teacher';
    return errs;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'email' ? value.toLowerCase() : value });
  };

  useEffect(() => { fetchTeachers(); fetchLectures(); }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await get<ApiResponse<Teacher[]>>(API_ENDPOINTS.TEACHERS);
      setTeachers(res?.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
    } finally { setLoading(false); }
  };

  const fetchLectures = async () => {
    try {
      const res = await get<ApiResponse<LectureRef[]>>(API_ENDPOINTS.LECTURES.LIST);
      const lecturesData = res?.data || [];
      const nonDefault = lecturesData.filter((lecture: LectureRef) => !lecture.isDefault);
      setLectures(nonDefault);
    } catch (error) {
      console.error('Error fetching lectures:', error);
      toast.error('Failed to load lectures');
    }
  };

  const handleView = (teacher: Teacher) => { setSelectedTeacher(teacher); setShowViewModal(true); };

  const handleDelete = (teacherId: string, teacherName: string) => { setTeacherToDelete({ id: teacherId, name: teacherName }); setDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    try {
      setIsDeleting(true);
      const res = await del<ApiResponse & { success?: boolean }>(API_ENDPOINTS.USERS.DELETE(teacherToDelete.id));
      if (res?.status === 200) {
        toast.success(`Teacher ${teacherToDelete.name} deleted successfully`);
        setTeachers(teachers.filter(teacher => teacher.id !== teacherToDelete.id));
      } else { toast.error('Failed to delete teacher'); }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete teacher');
    } finally { setIsDeleting(false); setDeleteModalOpen(false); setTeacherToDelete(null); }
  };

  const handleEdit = (teacher: Teacher) => {
    setFormData({ name: teacher.name, email: teacher.email, teacherCode: teacher.teacherCode, phone: teacher.phone || '', lectures: teacher.lectures ? teacher.lectures.map(l => typeof l === 'string' ? l : l.id) : [] });
    setEditingId(teacher.id);
    setShowAddForm(true);
  };

  const addLecture = (lectureId: string) => { if (lectureId && !formData.lectures.includes(lectureId)) { setFormData({ ...formData, lectures: [...formData.lectures, lectureId] }); } };
  const removeLecture = (lectureId: string) => { setFormData({ ...formData, lectures: formData.lectures.filter(id => id !== lectureId) }); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) { Object.values(validationErrors).forEach(error => toast.error(error)); setErrors(validationErrors); return; }
    try {
      setIsSubmitting(true);
      if (editingId) {
        const res = await put<ApiResponse<Teacher> & { success?: boolean }>(API_ENDPOINTS.USERS.UPDATE(editingId), { name: formData.name, email: formData.email, teacherCode: formData.teacherCode, phone: formData.phone, lectures: formData.lectures });
        if (res?.status === 200) { toast.success('Teacher updated successfully'); if (res.data) setTeachers(teachers.map(teacher => teacher.id === editingId ? res.data! : teacher)); }
      } else {
        const password = generatePassword(formData.name);
        const res = await post<ApiResponse<Teacher> & { success?: boolean }>(API_ENDPOINTS.REGISTER, { ...formData, password, role: 'teacher' });
        if (res?.status === 200 || res?.status === 201) { toast.success('Teacher created successfully and Welcome email sent with login credentials'); if (res.data) setTeachers([...teachers, res.data]); }
      }
      setFormData({ name: '', email: '', teacherCode: '', phone: '', lectures: [] });
      setEditingId(null); setShowAddForm(false); setErrors({});
    } catch (error) {
      console.error('Error saving teacher:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save teacher');
    } finally { setIsSubmitting(false); }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.teacherCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center"><Users className="mr-2 text-blue-500" size={20} />Teacher Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage teacher records and accounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { if (showAddForm) { setFormData({ name: '', email: '', teacherCode: '', phone: '', lectures: [] }); setEditingId(null); setErrors({}); } setShowAddForm(!showAddForm); }} className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${showAddForm ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {showAddForm ? (<><X size={16} className="mr-2" />Cancel</>) : (<><Plus size={16} className="mr-2" />Add Teacher</>)}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100 transition-all">
          <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center"><UserCheck className="mr-2 text-blue-500" size={18} />{editingId ? 'Edit Teacher' : 'Add New Teacher'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col"><label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter Teacher's full name" />{errors.name && <p className="text-red-500 text-xs italic mt-1">{errors.name}</p>}</div>
              <div className="flex flex-col"><label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="teacher@example.com" />{errors.email && <p className="text-red-500 text-xs italic mt-1">{errors.email}</p>}</div>
              <div className="flex flex-col"><label htmlFor="teacherCode" className="text-sm font-medium text-gray-700 mb-1">Teacher Code</label><input type="text" id="teacherCode" name="teacherCode" value={formData.teacherCode} onChange={handleInputChange} required className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. TCH12345" />{errors.teacherCode && <p className="text-red-500 text-xs italic mt-1">{errors.teacherCode}</p>}</div>
              <div className="mb-4"><label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Enter 10-digit phone number" pattern="[0-9]{10}" />{errors.phone && <p className="text-red-500 text-xs italic mt-1">{errors.phone}</p>}</div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Assign Lectures <span className="text-red-500">*</span></label>
              {formData.lectures.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {formData.lectures.map(lectureId => { const lecture = lectures.find(l => l.id === lectureId); if (!lecture) return null; return (<span key={lecture.id} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{lecture.name}<button type="button" onClick={() => removeLecture(lecture.id)} className="ml-2 text-blue-600 hover:text-blue-800"><X className="h-3 w-3" /></button></span>); })}
                </div>
              )}
              <select value="" onChange={(e) => addLecture(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"><option value="">Click to assign lectures...</option>{lectures.filter(lecture => !formData.lectures.includes(lecture.id)).map((lecture) => <option key={lecture.id} value={lecture.id}>{lecture.name}</option>)}</select>
              {errors.lectures && <p className="text-red-500 text-xs italic mt-1">{errors.lectures}</p>}
              <p className="text-xs text-gray-500 mt-1">Teachers must be assigned to at least one lecture. They can only create students and slots for their assigned lectures.</p>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-md"><p className="text-sm text-blue-700">Password will be automatically generated and sent to the teacher&apos;s email address.</p></div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }} className={`flex-1 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center justify-center`}>
                {isSubmitting ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{editingId ? 'Updating...' : 'Adding...'}</>) : (<><Plus size={16} className="mr-2" />{editingId ? 'Update Teacher' : 'Add Teacher'}</>)}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative mb-6"><div className="flex items-center border border-gray-300 rounded-lg overflow-hidden"><div className="pl-3"><Search size={18} className="text-gray-400" /></div><input type="text" placeholder="Search teachers by name, email or code..." className="w-full px-3 py-2 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>

      <div className="bg-white rounded-lg">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-2 z-10"><h2 className="font-medium text-gray-700 flex items-center text-sm md:text-base">Teachers List<span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">{filteredTeachers.length}</span></h2></div>

        {filteredTeachers.length > 0 ? (
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Code</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-sm font-medium text-blue-800">{teacher.name.charAt(0)}</span></div><div className="ml-4"><div className="text-sm font-medium text-gray-900">{teacher.name}</div></div></div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{teacher.teacherCode}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => handleView(teacher)} className="text-indigo-600 hover:text-indigo-900 flex items-center"><Eye className="w-5 h-5 mr-1" />View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden"><ul>{filteredTeachers.map((teacher) => (<li key={teacher.id} className="bg-white rounded-lg shadow-sm p-4 mb-4"><div className="flex items-center justify-between mb-2"><div className="flex items-center"><div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-sm font-medium text-blue-800">{teacher.name.charAt(0)}</span></div><div className="ml-4"><div className="text-sm font-medium text-gray-900">{teacher.name}</div></div></div><button onClick={() => handleView(teacher)} className="text-indigo-600 hover:text-indigo-900 text-sm flex items-center" title="View Teacher"><Eye size={18} className="inline-block mr-1" />View</button></div><div className="text-sm text-gray-500 flex items-center mb-2"><Mail size={14} className="mr-1 text-gray-400" />{teacher.email}</div><div className="text-sm text-gray-500 flex items-center mb-2"><UserCheck size={14} className="mr-1 text-gray-400" />{teacher.teacherCode}</div></li>))}</ul></div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 bg-gray-50 rounded-lg"><div className="bg-gray-200 p-3 rounded-full"><Users size={24} className="text-gray-500" /></div><p className="mt-4 text-center text-gray-600 text-sm px-4">{searchTerm ? 'No teachers found matching your search criteria.' : 'No teachers found. Add your first teacher using the button above.'}</p></div>
        )}
      </div>

      <div>
        {showViewModal && selectedTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowViewModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold text-gray-900">Teacher Details</h3><button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button></div>
              <div className="space-y-6">
                <div className="flex items-center space-x-4 pb-4 border-b"><div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-2xl font-medium text-blue-800">{selectedTeacher.name.charAt(0)}</span></div><div><h4 className="text-lg font-semibold text-gray-900">{selectedTeacher.name}</h4><p className="text-sm text-gray-500">{selectedTeacher.teacherCode}</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-500 mb-1">Email</label><div className="flex items-center text-gray-900"><Mail size={16} className="mr-2 text-gray-400" />{selectedTeacher.email}</div></div><div><label className="block text-sm font-medium text-gray-500 mb-1">Phone</label><div className="text-gray-900">{selectedTeacher.phone || 'N/A'}</div></div></div>
                <div><label className="block text-sm font-medium text-gray-500 mb-2">Assigned Lectures</label>{selectedTeacher.lectures && selectedTeacher.lectures.length > 0 ? (<div className="flex flex-wrap gap-2">{selectedTeacher.lectures.map((lecture) => { const lec = typeof lecture === 'string' ? lecture : lecture; const key = typeof lecture === 'string' ? lecture : lecture.id; const name = typeof lecture === 'string' ? lecture : lecture.name; return (<span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">{name}</span>); })}</div>) : (<p className="text-gray-500 text-sm">No lectures assigned</p>)}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-500 mb-1">Created At</label><div className="text-gray-900 text-sm">{selectedTeacher.createdAt ? new Date(selectedTeacher.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div></div><div><label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label><div className="text-gray-900 text-sm">{selectedTeacher.updatedAt ? new Date(selectedTeacher.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div></div></div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button onClick={() => { setShowViewModal(false); handleEdit(selectedTeacher); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"><Edit className="w-4 h-4 mr-2" />Edit</button>
                <button onClick={() => { setShowViewModal(false); handleDelete(selectedTeacher.id, selectedTeacher.name); }} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"><Trash2 className="w-4 h-4 mr-2" />Delete</button>
              </div>
            </div>
          </div>
        )}

        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
              <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-medium text-gray-900">Delete Teacher</h3><button onClick={() => { setDeleteModalOpen(false); setTeacherToDelete(null); }} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button></div>
              <div className="mb-6"><p className="text-gray-600">Are you sure you want to delete {teacherToDelete?.name}? This action cannot be undone.</p></div>
              <div className="flex justify-end space-x-4">
                <button onClick={() => { setDeleteModalOpen(false); setTeacherToDelete(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={confirmDelete} disabled={isDeleting} className={`px-4 py-2 ${isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white rounded-md`}>
                  {isDeleting ? (<span className="flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Deleting...</span>) : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManagements;
