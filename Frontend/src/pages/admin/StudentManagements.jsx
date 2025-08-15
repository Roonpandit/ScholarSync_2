import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { formatDateDisplay, formatTime24h, convertToIST } from '../../utils/timeUtils';
import { Users, Plus, X, Calendar, Mail, UserCheck, Search, Eye, CheckCircle, Trash2 } from 'lucide-react';
import BulkUpload from './BulkUploads';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/Loader';

const StudentManagements = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentCode: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    
    if (!formData.studentCode.trim()) {
      errors.studentCode = 'Student code is required';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.password = 'Passwords do not match';
      errors.confirmPassword = 'Passwords do not match';
    } else {
      const password = formData.password;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const isLongEnough = password.length >= 8;

      if (!isLongEnough) {
        errors.password = 'Password must be at least 8 characters long';
      } else if (!hasUpperCase) {
        errors.password = 'Password must contain at least one uppercase letter (A-Z)';
      } else if (!hasLowerCase) {
        errors.password = 'Password must contain at least one lowercase letter (a-z)';
      } else if (!hasNumber) {
        errors.password = 'Password must contain at least one number (0-9)';
      } else if (!hasSpecialChar) {
        errors.password = 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
      }
    }
    
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    setFormData({
      ...formData,
      [name]: name === "email" ? value.toLowerCase() : value
    });
  };
  
  const [errors, setErrors] = useState({});

  const viewStudentDetails = (studentId) => {
    navigate(`/admin/students/${studentId}`);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/students');
      setStudents(res.data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (studentId, studentName) => {
    setStudentToDelete({ id: studentId, name: studentName });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await axios.delete(`/admin/students/${studentToDelete.id}`);
      
      if (res.data.success) {
        toast.success(`Student ${studentToDelete.name} deleted successfully`);
        setStudents(students.filter(student => student._id !== studentToDelete.id));
      } else {
        toast.error('Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => {
        toast.error(error);
      });
      setErrors(errors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      // Create a copy of formData without confirmPassword
      const { confirmPassword, ...postData } = formData;
      const res = await axios.post('/admin/students', postData);
      
      if (res.data.success) {
        toast.success('Student created successfully and Welcome email sent');
        setStudents([...students, res.data.data]);
        setFormData({
          name: '',
          email: '',
          studentCode: '',
          password: '',
          phone: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding student:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add student';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => formatDateDisplay(convertToIST(new Date(date)));

  if (loading) {
    return <Loader message="Loading students data..." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <Users className="mr-2 text-blue-500" size={20} />
            Student Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage student records and accounts</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showAddForm 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {showAddForm ? (
              <>
                <X size={16} className="mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Add Student
              </>
            )}
          </button>
          <BulkUpload />
        </div>
      </div>
      
      {/* Add Student Form */}
      {showAddForm && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100 transition-all">
          <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <UserCheck className="mr-2 text-blue-500" size={18} />
            Add New Student
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter student's full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.name}</p>
                )}
              </div>
              
              <div className="flex flex-col">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="student@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.email}</p>
                )}
              </div>
              
              <div className="flex flex-col">
                <label htmlFor="studentCode" className="text-sm font-medium text-gray-700 mb-1">Student Code</label>
                <input
                  type="text"
                  id="studentCode"
                  name="studentCode"
                  value={formData.studentCode}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. STU12345"
                />
                {errors.studentCode && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.studentCode}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter 10-digit phone number"
                  pattern="[0-9]{10}"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.phone}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                  Password
                </label>
                <div className="mt-1">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-10"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Eye size={20} className={`cursor-pointer ${showPassword ? 'opacity-50' : ''}`} />
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.password}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-10"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Eye size={20} className={`cursor-pointer ${showPassword ? 'opacity-50' : ''}`} />
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.confirmPassword}</p>
                  )}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-500'}`}>
                      <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                      <span>At least one lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-500'}`}>
                      <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                      <span>At least one number (0-9)</span>
                    </div>
                    <div className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-500' : 'text-gray-500'}`}>
                      <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                      <span>At least one special character</span>
                    </div>
                    <div className={`flex items-center ${formData.password.length >= 8 ? 'text-green-500' : 'text-gray-500'}`}>
                      <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                      <span>At least 8 characters long</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                className={`flex-1 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center justify-center`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Add Student
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <div className="pl-3">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search students by name, email or code..."
            className="w-full px-3 py-2 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Students List */}
      <div className="bg-white rounded-lg">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-2 z-10">
          <h2 className="font-medium text-gray-700 flex items-center text-sm md:text-base">
            Students List
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {filteredStudents.length}
            </span>
          </h2>
        </div>
        
        {filteredStudents.length > 0 ? (
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
            <>
              {/* Desktop view - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-800">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {student.studentCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewStudentDetails(student._id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="w-5 h-5 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(student._id, student.name)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <Trash2 className="w-5 h-5 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile view - List */}
              <div className="md:hidden">
                <ul>
                  {filteredStudents.map((student) => (
                    <li key={student._id} className="bg-white rounded-lg shadow-sm p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-800">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewStudentDetails(student._id)}
                            className="text-blue-600 hover:text-blue-900 text-sm flex items-center"
                            title="View Details"
                          >
                            <Eye size={18} className="inline-block mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(student._id, student.name)}
                            className="text-red-600 hover:text-red-900 text-sm flex items-center"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 size={18} className="inline-block mr-1" />
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mb-2">
                        <Mail size={14} className="mr-1 text-gray-400" />
                        {student.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mb-2">
                        <UserCheck size={14} className="mr-1 text-gray-400" />
                        {student.studentCode}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 bg-gray-50 rounded-lg">
            <div className="bg-gray-200 p-3 rounded-full">
              <Users size={24} className="text-gray-500" />
            </div>
            <p className="mt-4 text-center text-gray-600 text-sm px-4">
              {searchTerm ? 'No students found matching your search criteria.' : 'No students found. Add your first student using the button above.'}
            </p>
          </div>
        )}
      </div>
    <div>
      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Delete Student
              </h3>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setStudentToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`px-4 py-2 ${isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white rounded-md`}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default StudentManagements; 