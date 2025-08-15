import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Modal, Form, Input, Button, Space } from 'antd';
import { Camera, MapPin, X } from 'lucide-react';
import { UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons';
import { formatDateDisplay, formatTime24h, convertToIST } from '../../utils/timeUtils';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';

const StudentDetail = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/teacher/students/${studentId}/details`);
      setStudentData(response.data.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const attendanceStats = studentData?.attendance?.stats || { present: 0, absent: 0, total: 0 };

  if (loading) {
    return <Loader message="Loading student details..." />;
  }

  const handleEdit = () => {
    setIsEditing(true);
    // Set initial values for all fields
    editForm.setFieldsValue({
      name: studentData?.student?.name || '',
      email: studentData?.student?.email || '',
      studentCode: studentData?.student?.studentCode || '',
      phone: studentData?.student?.phone || ''
    });
  };

  const handleEditSubmit = async (values) => {
    try {
      // Only send the fields that can be edited
      const { name, phone } = values;
      const response = await axios.put(`/teacher/students/${studentId}`, { name, phone });
      
      if (response.data.success) {
        toast.success('Student details updated successfully');
        setStudentData({ 
          ...studentData, 
          student: {
            ...studentData.student,
            name,
            phone
          }
        });
        setIsEditing(false);
      } else {
        toast.error('Failed to update student details');
      }
    } catch (error) {
      console.error('Error updating student details:', error);
      toast.error(error.response?.data?.message || 'Failed to update student details');
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    editForm.resetFields();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Student Details Card */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="border-b border-gray-200 p-4 md:p-6 relative">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Student Details</h2>
          <button 
            onClick={() => navigate(-1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 md:p-6">
          <div className="mb-4">
            <button 
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center space-x-2 transition duration-200"
            >
              <EditOutlined /> 
              <span>Edit Details</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="flex items-center space-x-2">
              <UserOutlined className="text-gray-500" />
              <span className="font-medium">Name:</span>
              <span className="text-gray-700">{studentData?.student?.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MailOutlined className="text-gray-500" />
              <span className="font-medium">Email:</span>
              <span className="text-gray-700 break-all">{studentData?.student?.email}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <PhoneOutlined className="text-gray-500" />
              <span className="font-medium">Phone:</span>
              <span className="text-gray-700">{studentData?.student?.phone}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CalendarOutlined className="text-gray-500" />
              <span className="font-medium">Student Code:</span>
              <span className="text-gray-700">{studentData?.student?.studentCode}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal for Editing Student Details */}
      <Modal
        title="Edit Student Details"
        open={isEditing}
        onCancel={handleEditCancel}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          className="max-w-lg"
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter student name' }]}
          >
            <Input placeholder="Enter student's full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
          >
            <Input 
              placeholder="student@example.com" 
              disabled
              className="bg-gray-100"
            />
          </Form.Item>

          <Form.Item
            name="studentCode"
            label="Student Code"
          >
            <Input 
              placeholder="e.g. STU12345" 
              disabled
              className="bg-gray-100"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' }
            ]}
          >
            <Input placeholder="Enter 10-digit phone number" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="default" onClick={handleEditCancel}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Photo Modal */}
      <Modal
        title="Attendance Photo"
        open={photoModalOpen}
        onCancel={() => setPhotoModalOpen(false)}
        footer={null}
      >
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
          </div>
          <div className="p-4">
            {selectedPhoto ? (
              <img
                src={selectedPhoto}
                alt="Attendance"
                className="w-full max-h-[80vh] object-contain"
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No photo available</p>
              </div>
            )}
        </div>
      </Modal>

      {/* Attendance History Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Attendance History</h2>
        </div>
        
        <div className="p-4 md:p-6">
          {/* Attendance Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Total</h3>
              <p className="text-2xl font-bold">{attendanceStats.total}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-green-600">Present</h3>
              <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-red-600">Absent</h3>
              <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-blue-600">Attendance Rate</h3>
              <p className="text-2xl font-bold text-blue-600">
                {attendanceStats.total > 0 ? 
                  `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%` : 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Attendance Table */}
          <div className="overflow-x-auto">
            <Table 
              dataSource={studentData?.attendance?.records || []} 
              rowKey="_id"
              className="min-w-full"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 10 }}
            >
              <Table.Column 
                title="Date" 
                dataIndex="date" 
                key="date" 
                render={(date) => formatDateDisplay(convertToIST(new Date(date)))} 
              />
              <Table.Column 
                title="Shift" 
                dataIndex="shift" 
                key="shift" 
                render={(shift) => shift?.charAt(0)?.toUpperCase() + shift?.slice(1)}
              />
              <Table.Column 
                title="Slot Time" 
                dataIndex="slot" 
                key="slot" 
                render={(slot) => 
                  slot && `${formatTime24h(slot.startTime)} - ${formatTime24h(slot.endTime)}`
                } 
              />
              <Table.Column 
                title="Status" 
                dataIndex="status" 
                key="status" 
                render={(status, record) => {
                  // Handle different record types
                  const recordType = record?.type;
                  const recordStatus = record?.status;
                  
                  const statusText = recordType ? 
                    (recordType === 'absence' ? 'Absent' : 
                     recordType === 'pending' ? 'Pending' : 
                     'Present') : 
                    (recordStatus || status || 'Present');
                  
                  const colorClass = 
                    (statusText === 'Present' ? 'bg-green-100 text-green-800' : 
                     statusText === 'Absent' ? 'bg-red-100 text-red-800' : 
                     statusText === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                     'bg-gray-100 text-gray-800');

                  return (
                    <span className={`px-2 py-1 rounded text-sm ${colorClass}`}>
                      {statusText}
                    </span>
                  );
                }}
              />
              <Table.Column 
                title="Marked At" 
                dataIndex="markedAt" 
                key="markedAt" 
                render={(markedAt) => {
                  if (!markedAt) return null;
                  try {
                    const dateObj = new Date(markedAt);
                    if (isNaN(dateObj.getTime())) return null;
                    return formatTime24h(dateObj);
                  } catch (error) {
                    console.error('Error formatting markedAt:', error);
                    return null;
                  }
                }} 
              />
              <Table.Column 
                title="Location" 
                dataIndex="location" 
                key="location" 
                render={(location) => (
                  <div className="flex items-center">
                    <button
                      className="inline-flex items-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => {
                        toast.info(`Location: ${location?.coordinates?.join(', ')}`);
                      }}
                    >
                      <MapPin className="w-3 h-3 mr-1 sm:mr-2" />
                      View
                    </button>
                  </div>
                )}
              />
              <Table.Column 
                title="Photo" 
                dataIndex="photo" 
                key="photo" 
                render={(photo) => (
                  <div className="flex items-center">
                    <button
                      className="inline-flex items-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => {
                        setSelectedPhoto(photo?.url);
                        setPhotoModalOpen(true);
                      }}
                    >
                      <Camera className="w-3 h-3 mr-1 sm:mr-2" />
                      View
                    </button>
                  </div>
                )}
              />
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;