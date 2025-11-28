import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, Search, Eye, Users, GraduationCap } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modals from './Modals';
import StudentDetails from './StudentDetails';
import TeacherDetails from './TeacherDetails';
import Loader from '../../components/Loader';

const LectureManagement = () => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [lectureStudents, setLectureStudents] = useState([]);
  const [lectureTeachers, setLectureTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [viewMode, setViewMode] = useState('students'); // 'students' or 'teachers'
  const [viewingStudentId, setViewingStudentId] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/lectures`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lecturesData = response.data?.data || response.data?.Lectures || [];
      setLectures(lecturesData);
    } catch (error) {
      console.error('Error fetching lectures:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch lectures');
      setLectures([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllStudents(response.data.students);
    } catch (error) {
      toast.error('Failed to fetch students');
    }
  };

  const fetchLectureStudents = async (lectureId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/lectures/${lectureId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLectureStudents(response.data.data || response.data.students || []);
    } catch (error) {
      console.error('Error fetching lecture students:', error);
      toast.error('Failed to fetch lecture students');
      setLectureStudents([]);
    }
  };

  const fetchLectureTeachers = async (lectureId) => {
    try {
      const token = localStorage.getItem('token');
      // Get all teachers and filter by lecture
      const response = await axios.get(`${API_URL}/admin/teachers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTeachers = response.data.data || response.data.teachers || [];
      // Filter teachers who have this lecture assigned
      const teachersInLecture = allTeachers.filter(teacher =>
        teacher.lectures && teacher.lectures.some(lec =>
          (lec._id || lec) === lectureId
        )
      );
      setLectureTeachers(teachersInLecture);
    } catch (error) {
      toast.error('Failed to fetch lecture teachers');
      setLectureTeachers([]);
    }
  };

  const handleCreateLecture = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/lectures`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      fetchLectures();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create lecture');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLecture = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/lectures/${selectedLecture._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Lecture updated successfully');
      setShowEditModal(false);
      setSelectedLecture(null);
      setFormData({ name: '', description: '' });
      fetchLectures();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lecture');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (lecture) => {
    if (lecture.isDefault) {
      toast.error('Cannot delete the default lecture');
      return;
    }
    setLectureToDelete(lecture);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/lectures/${lectureToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Lecture deleted successfully');
      setDeleteModalOpen(false);
      setLectureToDelete(null);
      fetchLectures();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete lecture');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewLecture = (lecture) => {
    setSelectedLecture(lecture);
    fetchLectureStudents(lecture._id);
    fetchLectureTeachers(lecture._id);
    setShowViewModal(true);
  };

  const handleOpenAddStudents = () => {
    fetchAllStudents();
    setSelectedStudentIds([]);
    setShowAddStudentsModal(true);
  };

  const handleAssignStudents = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/lectures/assign`,
        {
          lectureIds: [selectedLecture._id],
          studentIds: selectedStudentIds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Students assigned to lecture successfully');
      setShowAddStudentsModal(false);
      setSelectedStudentIds([]);
      fetchLectureStudents(selectedLecture._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign students');
    }
  };

  const handleEditClick = (lecture) => {
    setSelectedLecture(lecture);
    setFormData({
      name: lecture.name,
      description: lecture.description || ''
    });
    setShowEditModal(true);
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredLectures = (lectures || []).filter(lecture =>
    lecture.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecture.lectureId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableStudents = (allStudents || []).filter(
    student => !(lectureStudents || []).some(ls => ls._id === student._id)
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Lecture Management</h1>
        <p className="text-gray-600">Create and manage student lectures</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search lectures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Lecture
        </button>
      </div>

      {/* Table */}
      {filteredLectures.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No lectures found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lecture Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLectures.map((lecture) => (
                  <tr key={lecture._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{lecture.name}</div>
                        {lecture.isDefault && (
                          <Star className="ml-2 h-4 w-4 text-yellow-500 fill-yellow-500" title="Default Lecture" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lecture.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {lecture.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {lecture.isDefault && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Default
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleViewLecture(lecture)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Lecture Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 md:p-3 rounded-full">
                <Trash2 className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Delete Lecture</h3>
            </div>

            <p className="text-sm md:text-base text-gray-600 mb-2">
              Are you sure you want to delete this lecture?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-700">Name: {lectureToDelete?.name}</p>
              <p className="text-sm text-gray-600">ID: {lectureToDelete?.lectureId}</p>
            </div>
            <p className="text-sm text-red-600 mb-4">
              This action cannot be undone.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setLectureToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Lecture Details Modal */}
      <Modals
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedLecture(null);
          setLectureStudents([]);
          setLectureTeachers([]);
        }}
        title="Lecture Details"
        size="lg"
      >
        {selectedLecture && (
          <div>
            {/* Lecture Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Lecture Name</p>
                  <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    {selectedLecture.name}
                    {selectedLecture.isDefault && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lecture ID</p>
                  <p className="text-base font-semibold text-gray-900">{selectedLecture.lectureId}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-base text-gray-900">{selectedLecture.description || 'No description'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedLecture.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedLecture.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {selectedLecture.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditClick(selectedLecture);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleDeleteClick(selectedLecture);
                  }}
                  disabled={selectedLecture.isDefault}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    selectedLecture.isDefault
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>

            {/* Toggle and List Section */}
            <div>
              {/* Toggle Buttons */}
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1">
                  <button
                    onClick={() => setViewMode('students')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'students'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    Students ({lectureStudents.length})
                  </button>
                  <button
                    onClick={() => setViewMode('teachers')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'teachers'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Teachers ({lectureTeachers.length})
                  </button>
                </div>

                {viewMode === 'students' && (
                  <button
                    onClick={handleOpenAddStudents}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Students
                  </button>
                )}
              </div>

              {/* Students View */}
              {viewMode === 'students' && (
                <>
                  {lectureStudents.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No students in this lecture</p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {lectureStudents.map((student) => (
                            <tr key={student._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{student.studentCode}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setViewingStudentId(student._id)}
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 text-sm"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Teachers View */}
              {viewMode === 'teachers' && (
                <>
                  {lectureTeachers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No teachers assigned to this lecture</p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {lectureTeachers.map((teacher) => (
                            <tr key={teacher._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{teacher.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{teacher.teacherCode}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setViewingTeacher(teacher)}
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 text-sm"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modals>

      {/* Create Lecture Modal */}
      <Modals
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ name: '', description: '' });
        }}
        title="Create New Lecture"
        size="md"
      >
        <form onSubmit={handleCreateLecture} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lecture Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={3}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: '', description: '' });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Lecture'}
            </button>
          </div>
        </form>
      </Modals>

      {/* Edit Lecture Modal */}
      <Modals
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLecture(null);
          setFormData({ name: '', description: '' });
        }}
        title={`Edit Lecture${selectedLecture?.isDefault ? ' (Default)' : ''}`}
        size="md"
      >
        <form onSubmit={handleUpdateLecture} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lecture Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={3}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedLecture(null);
                setFormData({ name: '', description: '' });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Lecture'}
            </button>
          </div>
        </form>
      </Modals>

      {/* Add Students Modal */}
      <Modals
        isOpen={showAddStudentsModal}
        onClose={() => {
          setShowAddStudentsModal(false);
          setSelectedStudentIds([]);
        }}
        title={`Add Students to ${selectedLecture?.name || 'Lecture'}`}
        size="lg"
      >
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Select students to add to this lecture
          </p>

          {availableStudents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">All students are already in this lecture</p>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds(availableStudents.map(s => s._id));
                            } else {
                              setSelectedStudentIds([]);
                            }
                          }}
                          checked={selectedStudentIds.length === availableStudents.length && availableStudents.length > 0}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Code</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {availableStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={() => toggleStudentSelection(student._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.studentCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Selected: <span className="font-semibold">{selectedStudentIds.length}</span> students
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStudentsModal(false);
                      setSelectedStudentIds([]);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignStudents}
                    disabled={selectedStudentIds.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Add Selected
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modals>

      {/* Student Detail Modal */}
      {viewingStudentId && (
        <StudentDetails
          isModal={true}
          studentIdProp={viewingStudentId}
          onClose={() => setViewingStudentId(null)}
        />
      )}

      {/* Teacher Detail Modal */}
      {viewingTeacher && (
        <TeacherDetails
          isModal={true}
          teacherDataProp={viewingTeacher}
          onClose={() => setViewingTeacher(null)}
        />
      )}
    </div>
  );
};

export default LectureManagement;
