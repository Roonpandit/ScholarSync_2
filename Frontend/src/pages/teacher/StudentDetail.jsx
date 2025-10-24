import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Form, Input, Button, Space, Table } from 'antd';
import { Mail, Phone, X, Edit, Trash2, Calendar, MapPin, Camera } from 'lucide-react';
import { formatDateDisplay, formatTime24h, convertToIST } from '../../utils/timeUtils';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';

const StudentDetail = ({ isModal = false, studentIdProp = null, onClose = null }) => {
  const navigate = useNavigate();
  const { studentId: paramStudentId } = useParams();
  const studentId = isModal ? studentIdProp : paramStudentId;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [editForm] = Form.useForm();
  const [allBatches, setAllBatches] = useState([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [markAbsentModalOpen, setMarkAbsentModalOpen] = useState(false);
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState(null);
  const [absentRemark, setAbsentRemark] = useState('');
  const [markingAbsent, setMarkingAbsent] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState('');
  const [approvingAttendance, setApprovingAttendance] = useState(false);
  const [rejectingAttendance, setRejectingAttendance] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
      fetchAllBatches();
    }
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/teacher/students/${studentId}/details`);
      setStudent(response.data.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBatches = async () => {
    try {
      // Teachers: get batches from auth/me endpoint (includes teacher's assigned batches)
      const response = await axios.get('/auth/me');
      const batchesData = response.data?.data?.batches || [];
      setAllBatches(batchesData);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
      setAllBatches([]);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Set initial values for editable fields only (name and phone for teachers)
    editForm.setFieldsValue({
      name: student?.student?.name || '',
      phone: student?.student?.phone || ''
    });
    // Reset selected batches for adding new ones
    setSelectedBatchIds([]);
  };

  const handleEditSubmit = async (values) => {
    try {
      // Only send the fields that can be edited
      const { name, phone } = values;
      const response = await axios.put(`/teacher/students/${studentId}`, { name, phone });

      if (response.data.success) {
        // If batches were selected to add, add them
        if (selectedBatchIds.length > 0) {
          try {
            await axios.post(`/teacher/students/${studentId}/add-batches`, {
              batches: selectedBatchIds
            });
            toast.success('Student details and batches updated successfully');
          } catch (batchError) {
            console.error('Error adding batches:', batchError);
            toast.warning('Student details updated, but failed to add some batches');
          }
        } else {
          toast.success('Student details updated successfully');
        }

        setIsEditing(false);
        // Refresh to get updated info
        fetchStudentDetails();
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
    setSelectedBatchIds([]);
    editForm.resetFields();
  };

  const handleBatchToggle = (batchId) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleDelete = async () => {
    toast.error('Teachers cannot delete students. Please contact an administrator.');
  };

  const handleViewAttendance = () => {
    setShowAttendance(true);
  };

  const handleOpenMarkAbsentModal = (record) => {
    setSelectedAttendanceRecord(record);
    setAbsentRemark('');
    setMarkAbsentModalOpen(true);
  };

  const handleCloseMarkAbsentModal = () => {
    setMarkAbsentModalOpen(false);
    setSelectedAttendanceRecord(null);
    setAbsentRemark('');
  };

  const handleMarkAsAbsent = async () => {
    if (!absentRemark || absentRemark.trim().length === 0) {
      toast.error('Please provide a reason for marking as absent');
      return;
    }

    if (absentRemark.length > 1000) {
      toast.error('Remark must not exceed 1000 characters');
      return;
    }

    try {
      setMarkingAbsent(true);
      const response = await axios.post(`/teacher/attendance/${selectedAttendanceRecord._id}/mark-absent`, {
        remark: absentRemark.trim()
      });

      if (response.data.success) {
        toast.success('Attendance marked as absent successfully. Email notification sent to student.');
        handleCloseMarkAbsentModal();
        // Refresh student details to get updated attendance
        fetchStudentDetails();
      }
    } catch (error) {
      console.error('Error marking attendance as absent:', error);
      toast.error(error.response?.data?.message || 'Failed to mark attendance as absent');
    } finally {
      setMarkingAbsent(false);
    }
  };

  const handleApproveAttendance = async () => {
    try {
      setApprovingAttendance(true);
      const response = await axios.post(`/teacher/attendance/${selectedAttendanceRecord._id}/approve`);

      if (response.data.success) {
        toast.success('Attendance approved successfully');
        setApproveModalOpen(false);
        setSelectedAttendanceRecord(null);
        fetchStudentDetails();
      }
    } catch (error) {
      console.error('Error approving attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to approve attendance');
    } finally {
      setApprovingAttendance(false);
    }
  };

  const handleRejectAttendance = async () => {
    if (!rejectRemark || rejectRemark.trim().length === 0) {
      toast.error('Please provide a reason for rejecting attendance');
      return;
    }

    try {
      setRejectingAttendance(true);
      const response = await axios.post(`/teacher/attendance/${selectedAttendanceRecord._id}/reject`, {
        remark: rejectRemark.trim()
      });

      if (response.data.success) {
        toast.success('Attendance rejected successfully. Email sent to student.');
        setRejectModalOpen(false);
        setSelectedAttendanceRecord(null);
        setRejectRemark('');
        fetchStudentDetails();
      }
    } catch (error) {
      console.error('Error rejecting attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to reject attendance');
    } finally {
      setRejectingAttendance(false);
    }
  };

  if (loading) {
    return <Loader message="Loading student details..." />;
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-500">Student not found</div>
      </div>
    );
  }

  const attendanceStats = student?.attendance?.stats || {
    total: 0,
    pending: 0,
    awaiting_approval: 0,
    present: 0,
    absent: 0
  };
  const batches = student?.student?.batches || [];

  const content = (
    <div className={isModal ? "" : "container mx-auto px-4 py-6"}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4 md:p-6 relative">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Student Details</h2>
          {!isModal && (
            <button
              onClick={() => navigate(-1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          )}
        </div>

        <div className="p-4 md:p-6">
          <div className="space-y-6">
            {/* Profile Section */}
            <div className="flex items-center space-x-4 pb-4 border-b">
              <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-medium text-blue-800">
                  {student?.student?.name?.charAt(0) || 'S'}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{student?.student?.name}</h4>
                <p className="text-sm text-gray-500">{student?.student?.studentCode}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <div className="flex items-center text-gray-900">
                  <Mail size={16} className="mr-2 text-gray-400" />
                  {student?.student?.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <div className="flex items-center text-gray-900">
                  <Phone size={16} className="mr-2 text-gray-400" />
                  {student?.student?.phone || 'N/A'}
                </div>
              </div>
            </div>

            {/* Batches Section */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Assigned Batches</label>
              {batches && batches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {batches.map((batch) => (
                    <span
                      key={batch._id || batch}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        batch.isDefault ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {batch.name || batch}
                      {batch.isDefault && ' (Default)'}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No batches assigned</p>
              )}
            </div>

            {/* Attendance Statistics */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Attendance Overview</label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Total</h3>
                  <p className="text-2xl font-bold text-gray-900">{attendanceStats.total}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-600">Pending</h3>
                  <p className="text-2xl font-bold text-yellow-600">{attendanceStats.pending}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-600">Awaiting Approval</h3>
                  <p className="text-2xl font-bold text-orange-600">{attendanceStats.awaiting_approval}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600">Present</h3>
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-600">Absent</h3>
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                <div className="flex items-center text-gray-900 text-sm">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  {student?.student?.createdAt ? new Date(student.student.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <div className="text-gray-900 text-sm">
                  {student?.student?.updatedAt ? new Date(student.student.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleViewAttendance}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Attendance
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed flex items-center"
              disabled
              title="Teachers cannot delete students"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <>
        <Modal
          open={true}
          onCancel={onClose}
          footer={null}
          width="90%"
          style={{ top: 20, maxWidth: 900 }}
          className="student-detail-modal"
        >
          {content}
        </Modal>

        {/* Edit Student Details Modal */}
        <Modal
          title="Edit Student Details (Teacher)"
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
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: 'Please enter phone number' },
                { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' }
              ]}
            >
              <Input placeholder="Enter 10-digit phone number" />
            </Form.Item>

            <div className="mb-4">
              <div className="mb-3 border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Batches</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto bg-gray-50 rounded-md p-2">
                  {batches && batches.length > 0 ? (
                    batches.map((batch) => (
                      <div key={batch._id} className="flex items-center text-sm text-gray-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {batch.name}
                        {batch.isDefault && (
                          <span className="ml-2 text-xs text-yellow-600">(Default)</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No batches assigned</p>
                  )}
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add More Batches (Optional)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {allBatches.filter(batch => !batches.some(b => b._id === batch._id)).length > 0 ? (
                  allBatches
                    .filter(batch => !batches.some(b => b._id === batch._id))
                    .map((batch) => (
                      <div key={batch._id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`batch-${batch._id}`}
                          checked={selectedBatchIds.includes(batch._id)}
                          onChange={() => handleBatchToggle(batch._id)}
                          className="mr-2"
                        />
                        <label htmlFor={`batch-${batch._id}`} className="cursor-pointer text-sm">
                          {batch.name}
                          {batch.isDefault && (
                            <span className="ml-2 text-xs text-yellow-600">(Default)</span>
                          )}
                        </label>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500">All available batches are already assigned</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Note: You can only add batches, not remove existing ones.
              </p>
            </div>

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

        {/* Attendance Modal */}
        <Modal
          title="Attendance History"
          open={showAttendance}
          onCancel={() => setShowAttendance(false)}
          footer={null}
          width="90%"
          style={{ top: 20, maxWidth: 1200 }}
        >
          <div className="space-y-4">
            {/* Attendance Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700">Total</h3>
                <p className="text-2xl font-bold">{attendanceStats.total}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-yellow-600">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600">{attendanceStats.pending}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-orange-600">Awaiting Approval</h3>
                <p className="text-2xl font-bold text-orange-600">{attendanceStats.awaiting_approval}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-green-600">Present</h3>
                <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-red-600">Absent</h3>
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <Table
                dataSource={student?.attendance?.records || []}
                rowKey="_id"
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
                  title="Batch"
                  dataIndex="batch"
                  key="batch"
                  render={(batch) => batch?.name || 'N/A'}
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
                       statusText === 'awaiting_approval' || statusText === 'Awaiting Approval' ? 'bg-orange-100 text-orange-800' :
                       'bg-gray-100 text-gray-800');

                    const displayText = statusText === 'awaiting_approval' ? 'Awaiting Approval' : statusText;

                    return (
                      <span className={`px-2 py-1 rounded text-sm ${colorClass}`}>
                        {displayText}
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
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        onClick={() => {
                          toast.info(`Location: ${location?.coordinates?.join(', ')}`);
                        }}
                      >
                        <MapPin className="w-3 h-3 mr-1" />
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
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                        onClick={() => {
                          setSelectedPhoto(photo?.url);
                          setPhotoModalOpen(true);
                        }}
                      >
                        <Camera className="w-3 h-3 mr-1" />
                        View
                      </button>
                    </div>
                  )}
                />
                <Table.Column
                  title="Actions"
                  key="actions"
                  render={(_, record) => {
                    const recordType = record?.type;
                    const recordStatus = record?.status;
                    const statusText = recordType ?
                      (recordType === 'absence' ? 'Absent' :
                       recordType === 'pending' ? 'Pending' :
                       'Present') :
                      (recordStatus || record.status || 'Present');

                    const isSlotClosed = record?.slot?.isClosed;

                    // Show Approve/Reject for awaiting_approval status
                    if (statusText === 'awaiting_approval' && !isSlotClosed) {
                      return (
                        <div className="flex items-center gap-2">
                          <button
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedAttendanceRecord(record);
                              setApproveModalOpen(true);
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                            onClick={() => {
                              setSelectedAttendanceRecord(record);
                              setRejectRemark('');
                              setRejectModalOpen(true);
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      );
                    }

                    return null;
                  }}
                />
              </Table>
            </div>
          </div>
        </Modal>

        {/* Photo Modal */}
        <Modal
          title="Attendance Photo"
          open={photoModalOpen}
          onCancel={() => setPhotoModalOpen(false)}
          footer={null}
        >
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

        {/* Mark as Absent Modal */}
        <Modal
          title="Mark Attendance as Absent"
          open={markAbsentModalOpen}
          onCancel={handleCloseMarkAbsentModal}
          footer={null}
        >
          <div className="p-4">
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> You are about to mark this student's attendance as absent.
                The student will receive an email notification with your reason.
              </p>
            </div>

            {selectedAttendanceRecord && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Attendance Details:</h4>
                <p className="text-sm"><strong>Date:</strong> {selectedAttendanceRecord.date ? new Date(selectedAttendanceRecord.date).toLocaleDateString() : 'N/A'}</p>
                <p className="text-sm"><strong>Shift:</strong> {selectedAttendanceRecord.shift}</p>
                <p className="text-sm"><strong>Marked At:</strong> {selectedAttendanceRecord.markedAt ? new Date(selectedAttendanceRecord.markedAt).toLocaleString() : 'N/A'}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Marking Absent <span className="text-red-500">*</span>
              </label>
              <textarea
                value={absentRemark}
                onChange={(e) => setAbsentRemark(e.target.value)}
                placeholder="Enter the reason for marking this attendance as absent (max 1000 characters)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="5"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {absentRemark.length} / 1000 characters
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseMarkAbsentModal}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={markingAbsent}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsAbsent}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={markingAbsent || !absentRemark.trim()}
              >
                {markingAbsent ? 'Marking Absent...' : 'Mark as Absent & Send Email'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Approve Attendance Modal */}
        <Modal
          title="Approve Attendance"
          open={approveModalOpen}
          onCancel={() => {
            setApproveModalOpen(false);
            setSelectedAttendanceRecord(null);
          }}
          footer={null}
        >
          <div className="p-4">
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                <strong>Confirmation:</strong> You are about to approve this student's attendance.
                The attendance status will be changed to "Present".
              </p>
            </div>

            {selectedAttendanceRecord && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Attendance Details:</h4>
                <p className="text-sm"><strong>Student:</strong> {student?.student?.name}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedAttendanceRecord.date ? new Date(selectedAttendanceRecord.date).toLocaleDateString() : 'N/A'}</p>
                <p className="text-sm"><strong>Shift:</strong> {selectedAttendanceRecord.shift}</p>
                <p className="text-sm"><strong>Batch:</strong> {selectedAttendanceRecord.batch?.name || 'N/A'}</p>
                <p className="text-sm"><strong>Marked At:</strong> {selectedAttendanceRecord.markedAt ? new Date(selectedAttendanceRecord.markedAt).toLocaleString() : 'N/A'}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setApproveModalOpen(false);
                  setSelectedAttendanceRecord(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={approvingAttendance}
              >
                Cancel
              </button>
              <button
                onClick={handleApproveAttendance}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={approvingAttendance}
              >
                {approvingAttendance ? 'Approving...' : 'Approve Attendance'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Reject Attendance Modal */}
        <Modal
          title="Reject Attendance"
          open={rejectModalOpen}
          onCancel={() => {
            setRejectModalOpen(false);
            setSelectedAttendanceRecord(null);
            setRejectRemark('');
          }}
          footer={null}
        >
          <div className="p-4">
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> You are about to reject this student's attendance.
                The student will receive an email notification with your reason, and the attendance will be marked as "Pending".
              </p>
            </div>

            {selectedAttendanceRecord && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Attendance Details:</h4>
                <p className="text-sm"><strong>Student:</strong> {student?.student?.name}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedAttendanceRecord.date ? new Date(selectedAttendanceRecord.date).toLocaleDateString() : 'N/A'}</p>
                <p className="text-sm"><strong>Shift:</strong> {selectedAttendanceRecord.shift}</p>
                <p className="text-sm"><strong>Batch:</strong> {selectedAttendanceRecord.batch?.name || 'N/A'}</p>
                <p className="text-sm"><strong>Marked At:</strong> {selectedAttendanceRecord.markedAt ? new Date(selectedAttendanceRecord.markedAt).toLocaleString() : 'N/A'}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejecting Attendance <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectRemark}
                onChange={(e) => setRejectRemark(e.target.value)}
                placeholder="Enter the reason for rejecting this attendance (e.g., photo unclear, location mismatch, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="5"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {rejectRemark.length} / 1000 characters
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedAttendanceRecord(null);
                  setRejectRemark('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={rejectingAttendance}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectAttendance}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={rejectingAttendance || !rejectRemark.trim()}
              >
                {rejectingAttendance ? 'Rejecting...' : 'Reject & Send Email'}
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      {content}

      {/* Edit Student Details Modal */}
      <Modal
        title="Edit Student Details (Teacher)"
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
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' }
            ]}
          >
            <Input placeholder="Enter 10-digit phone number" />
          </Form.Item>

          <div className="mb-4">
            <div className="mb-3 border-t pt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Batches</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto bg-gray-50 rounded-md p-2">
                {batches && batches.length > 0 ? (
                  batches.map((batch) => (
                    <div key={batch._id} className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {batch.name}
                      {batch.isDefault && (
                        <span className="ml-2 text-xs text-yellow-600">(Default)</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No batches assigned</p>
                )}
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add More Batches (Optional)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
              {allBatches.filter(batch => !batches.some(b => b._id === batch._id)).length > 0 ? (
                allBatches
                  .filter(batch => !batches.some(b => b._id === batch._id))
                  .map((batch) => (
                    <div key={batch._id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`batch-page-${batch._id}`}
                        checked={selectedBatchIds.includes(batch._id)}
                        onChange={() => handleBatchToggle(batch._id)}
                        className="mr-2"
                      />
                      <label htmlFor={`batch-page-${batch._id}`} className="cursor-pointer text-sm">
                        {batch.name}
                        {batch.isDefault && (
                          <span className="ml-2 text-xs text-yellow-600">(Default)</span>
                        )}
                      </label>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500">All available batches are already assigned</p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Note: You can only add batches, not remove existing ones.
            </p>
          </div>

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

      {/* Attendance Modal */}
      <Modal
        title="Attendance History"
        open={showAttendance}
        onCancel={() => setShowAttendance(false)}
        footer={null}
        width="90%"
        style={{ top: 20, maxWidth: 1200 }}
      >
        <div className="space-y-4">
          {/* Attendance Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
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
              dataSource={student?.attendance?.records || []}
              rowKey="_id"
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
                title="Batch"
                dataIndex="batch"
                key="batch"
                render={(batch) => batch?.name || 'N/A'}
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
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                      onClick={() => {
                        toast.info(`Location: ${location?.coordinates?.join(', ')}`);
                      }}
                    >
                      <MapPin className="w-3 h-3 mr-1" />
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
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                      onClick={() => {
                        setSelectedPhoto(photo?.url);
                        setPhotoModalOpen(true);
                      }}
                    >
                      <Camera className="w-3 h-3 mr-1" />
                      View
                    </button>
                  </div>
                )}
              />
              <Table.Column
                title="Actions"
                key="actions"
                render={(_, record) => {
                  const recordType = record?.type;
                  const recordStatus = record?.status;
                  const statusText = recordType ?
                    (recordType === 'absence' ? 'Absent' :
                     recordType === 'pending' ? 'Pending' :
                     'Present') :
                    (recordStatus || record.status || 'Present');

                  // Only show Mark as Absent for Present status
                  if (statusText === 'Present') {
                    return (
                      <button
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                        onClick={() => handleOpenMarkAbsentModal(record)}
                      >
                        Mark Absent
                      </button>
                    );
                  }
                  return null;
                }}
              />
            </Table>
          </div>
        </div>
      </Modal>

      {/* Photo Modal */}
      <Modal
        title="Attendance Photo"
        open={photoModalOpen}
        onCancel={() => setPhotoModalOpen(false)}
        footer={null}
      >
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

      {/* Mark as Absent Modal */}
      <Modal
        title="Mark Attendance as Absent"
        open={markAbsentModalOpen}
        onCancel={handleCloseMarkAbsentModal}
        footer={null}
      >
        <div className="p-4">
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> You are about to mark this student's attendance as absent.
              The student will receive an email notification with your reason.
            </p>
          </div>

          {selectedAttendanceRecord && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h4 className="font-semibold mb-2">Attendance Details:</h4>
              <p className="text-sm"><strong>Date:</strong> {selectedAttendanceRecord.date ? new Date(selectedAttendanceRecord.date).toLocaleDateString() : 'N/A'}</p>
              <p className="text-sm"><strong>Shift:</strong> {selectedAttendanceRecord.shift}</p>
              <p className="text-sm"><strong>Marked At:</strong> {selectedAttendanceRecord.markedAt ? new Date(selectedAttendanceRecord.markedAt).toLocaleString() : 'N/A'}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Marking Absent <span className="text-red-500">*</span>
            </label>
            <textarea
              value={absentRemark}
              onChange={(e) => setAbsentRemark(e.target.value)}
              placeholder="Enter the reason for marking this attendance as absent (max 1000 characters)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              rows="5"
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {absentRemark.length} / 1000 characters
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseMarkAbsentModal}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={markingAbsent}
            >
              Cancel
            </button>
            <button
              onClick={handleMarkAsAbsent}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={markingAbsent || !absentRemark.trim()}
            >
              {markingAbsent ? 'Marking Absent...' : 'Mark as Absent & Send Email'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default StudentDetail;
