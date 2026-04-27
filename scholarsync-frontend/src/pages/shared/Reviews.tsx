import { useState, useEffect, type ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { get, post } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';
import type { ApiResponse } from '@/types/common.types';

interface Student {
  id: string;
  name: string;
  email: string;
  studentCode: string;
}

interface StudentsResponse {
  students: Student[];
}

const Reviews = () => {
  const [feedbackLink, setFeedbackLink] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await get<ApiResponse<StudentsResponse>>(API_ENDPOINTS.STUDENTS);
      // Handle both response shapes: { data: { students } } and { students }
      const raw = response as unknown as StudentsResponse & ApiResponse<StudentsResponse>;
      const studentsList = response?.data?.students || raw?.students || [];
      if (studentsList.length > 0) {
        setStudents(studentsList);
      } else {
        console.error('Invalid response format:', response);
        toast.error('Invalid response from server');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Error:', err.response?.data || err.message);
      toast.error('Failed to fetch students');
    }
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      setSelectedStudents(students.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => {
      const index = prev.indexOf(studentId);
      if (index === -1) {
        return [...prev, studentId];
      } else {
        return prev.filter(id => id !== studentId);
      }
    });
  };

  const handleSendFeedback = async () => {
    if (!feedbackLink.trim()) {
      toast.error('Please enter the feedback form link');
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      setIsLoading(true);
      await post(API_ENDPOINTS.NOTIFICATION.FEEDBACK_EMAILS, {
        feedbackLink,
        studentIds: selectedStudents
      });
      toast.success('Feedback emails sent successfully!');
      setFeedbackLink('');
      setSelectedStudents([]);
      setSelectAll(false);
    } catch (error) {
      toast.error('Failed to send feedback emails');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students ? students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Send Feedback Form</h1>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Feedback Form Link
        </label>
        <input
          type="url"
          value={feedbackLink}
          onChange={(e) => setFeedbackLink(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2.5 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-base sm:text-lg"
          placeholder="Enter feedback form link"
        />
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2.5 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-base sm:text-lg"
          placeholder="Search students..."
        />
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm sm:text-base">Select All</span>
          </div>
          <button
            onClick={handleSendFeedback}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-4 py-3 border-b-2 border-gray-300 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Student Code
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="border-b">
                    <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                        className="mr-2"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm">
                      {student.studentCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
