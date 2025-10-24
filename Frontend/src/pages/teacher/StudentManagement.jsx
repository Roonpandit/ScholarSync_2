import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { formatDateDisplay, formatTime24h, convertToIST } from '../../utils/timeUtils';
import { Users, Plus, X, Calendar, Mail, UserCheck, Search, Eye, CheckCircle } from 'lucide-react';
import BulkUpload from './BulkUpload';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/Loader';
import { useAuth } from '../../contexts/AuthContext';
import StudentDetail from './StudentDetail';

const StudentManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [defaultBatch, setDefaultBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingStudentId, setViewingStudentId] = useState(null);
  // Function to generate password based on student's name
  const generatePassword = (name) => {
    // Extract first name and capitalize first letter
    const firstName = name.split(' ')[0];
    return `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}@123`;
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentCode: '',
    phone: '',
    batches: []
  });
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

    // Batch validation is handled by backend

    return errors;
  };

  const [errors, setErrors] = useState({});
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "email" ? value.toLowerCase() : value
    });
  };

  const handleShowAddForm = () => {
    setShowAddForm(!showAddForm);
    if (!showAddForm && defaultBatch) {
      // Auto-select default batch when opening form
      setFormData({
        name: '',
        email: '',
        studentCode: '',
        phone: '',
        batches: [defaultBatch._id]
      });
    }
  };

  const viewStudentDetails = (studentId) => {
    setViewingStudentId(studentId);
  };

  useEffect(() => {
    fetchStudents();
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      // Teachers use their assigned batches from user context
      if (user && user.batches && Array.isArray(user.batches)) {
        setBatches(user.batches);

        // Get default batch
        const defBatch = user.batches.find(b => b.isDefault);
        setDefaultBatch(defBatch);

        // Auto-select default batch when form opens
        if (defBatch && showAddForm && formData.batches.length === 0) {
          setFormData(prev => ({
            ...prev,
            batches: [defBatch._id]
          }));
        }
      } else {
        // Fallback: fetch from API if user context doesn't have batches
        const res = await axios.get('/auth/me');
        const batchesData = res.data?.data?.batches || [];
        setBatches(batchesData);

        const defBatch = batchesData.find(b => b.isDefault);
        setDefaultBatch(defBatch);

        if (defBatch && showAddForm && formData.batches.length === 0) {
          setFormData(prev => ({
            ...prev,
            batches: [defBatch._id]
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
      setBatches([]);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/teacher/students');
      setStudents(res.data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
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
      // Generate password and create student
      const password = generatePassword(formData.name);
      const res = await axios.post('/teacher/students', {
        ...formData,
        password
      });
      
      if (res.data.success) {
        toast.success('Student created successfully and Welcome email sent');
        setStudents([...students, res.data.data]);
        setFormData({
          name: '',
          email: '',
          studentCode: '',
          phone: '',
          batches: defaultBatch ? [defaultBatch._id] : []
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
            onClick={handleShowAddForm}
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
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Batch Selection */}
            <div className="mb-4">
              <label htmlFor="batches" className="block text-gray-700 text-sm font-bold mb-2">
                Select Batches <span className="text-red-500">*</span>
              </label>

              {/* Selected Batches Display */}
              <div className="mb-3 flex flex-wrap gap-2">
                {formData.batches.length > 0 ? (
                  formData.batches.map(batchId => {
                    const batch = batches.find(b => b._id === batchId);
                    if (!batch) return null;
                    const isDefault = batch.isDefault;
                    return (
                      <span
                        key={batch._id}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          isDefault
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {batch.name}
                        {isDefault && (
                          <span className="ml-1 text-xs">(Default)</span>
                        )}
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                batches: prev.batches.filter(id => id !== batch._id)
                              }));
                            }}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-sm text-gray-500 italic">No batches selected</span>
                )}
              </div>

              {/* Dropdown to add batches */}
              <select
                id="batches"
                value=""
                onChange={(e) => {
                  const batchId = e.target.value;
                  if (batchId && !formData.batches.includes(batchId)) {
                    setFormData(prev => ({
                      ...prev,
                      batches: [...prev.batches, batchId]
                    }));
                  }
                  e.target.value = ''; // Reset dropdown
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Click to add more batches...</option>
                {(batches || []).filter(batch => !formData.batches.includes(batch._id)).map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name}
                  </option>
                ))}
              </select>

              {errors.batches && (
                <p className="text-red-500 text-xs italic mt-1">{errors.batches}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Default batch is mandatory and pre-selected. Select additional batches from the dropdown.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password Information */}
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  Password will be automatically generated and sent to the student's email address.
                </p>
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
                        <button
                          onClick={() => viewStudentDetails(student._id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="w-5 h-5 mr-1" />
                          View
                        </button>
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
                        <button
                          onClick={() => viewStudentDetails(student._id)}
                          className="text-blue-600 hover:text-blue-900 text-sm flex items-center"
                          title="View Details"
                        >
                          <Eye size={18} className="inline-block mr-1" />
                          View
                        </button>
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

      {/* Student Detail Modal */}
      {viewingStudentId && (
        <StudentDetail
          isModal={true}
          studentIdProp={viewingStudentId}
          onClose={() => setViewingStudentId(null)}
        />
      )}
    </div>
  );
};

export default StudentManagement; 