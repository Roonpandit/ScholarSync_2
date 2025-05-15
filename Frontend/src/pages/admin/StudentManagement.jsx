import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Users, Plus, X, Calendar, Mail, UserCheck, Search } from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentCode: '',
    password: ''
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await axios.post('/admin/students', formData);
      
      if (res.data.success) {
        toast.success('Student added successfully');
        setStudents([...students, res.data.data]);
        setFormData({
          name: '',
          email: '',
          studentCode: '',
          password: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error(error.response?.data?.message || 'Failed to add student');
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading students data...</p>
      </div>
    );
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
              </div>
              
              <div className="flex flex-col">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Set a secure password"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                type="submit" 
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center justify-center"
              >
                <Plus size={16} className="mr-2" />
                Add Student
              </button>
              <button 
                type="button" 
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 inline-flex items-center justify-center"
                onClick={() => setShowAddForm(false)}
              >
                <X size={16} className="mr-2" />
                Cancel
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-medium text-gray-700 flex items-center text-sm md:text-base">
            Students List
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {filteredStudents.length}
            </span>
          </h2>
        </div>
        
        {filteredStudents.length > 0 ? (
          <>
            {/* Desktop view - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
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
                        <div className="text-sm text-gray-900">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {student.studentCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar size={14} className="mr-1 text-gray-400" />
                          {formatDate(student.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile view - Card list */}
            <div className="md:hidden space-y-3">
              {filteredStudents.map((student) => (
                <div key={student._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-4">
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.studentCode}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pl-1">
                    <div className="flex items-center text-sm">
                      <Mail size={14} className="mr-2 text-gray-400" />
                      <span className="text-gray-600">{student.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar size={14} className="mr-2 text-gray-400" />
                      <span className="text-gray-500 text-xs">Created: {formatDate(student.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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
    </div>
  );
};

export default StudentManagement;