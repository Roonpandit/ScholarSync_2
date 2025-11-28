import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Form, Input, Button, Space } from 'antd';
import { Mail, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherDetails = ({ isModal = false, teacherIdProp = null, teacherDataProp = null, onClose = null }) => {
  const navigate = useNavigate();
  const { teacherId: paramTeacherId } = useParams();
  const teacherId = isModal ? teacherIdProp : paramTeacherId;

  const [teacher, setTeacher] = useState(teacherDataProp);
  const [loading, setLoading] = useState(!teacherDataProp);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [allLectures, setAllLectures] = useState([]);
  const [selectedLectureIds, setSelectedLectureIds] = useState([]);

  useEffect(() => {
    if (!teacherDataProp && teacherId) {
      fetchTeacherDetails();
    }
    fetchAllLectures();
  }, [teacherId, teacherDataProp]);

  const fetchAllLectures = async () => {
    try {
      const response = await axios.get('/lectures');
      const lecturesData = response.data?.data || response.data?.lectures || [];
      // Filter out default lecture - teachers don't get assigned to default lecture
      const nondefaultLecturees = lecturesData.filter(lecture => !lecture.isDefault);
      setAllLectures(nondefaultLecturees);
    } catch (error) {
      console.error('Error fetching lectures:', error);
      toast.error('Failed to load lectures');
      setAllLectures([]);
    }
  };

  const fetchTeacherDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/teachers/${teacherId}`);
      setTeacher(response.data.data || response.data.teacher);
    } catch (error) {
      console.error('Error fetching teacher details:', error);
      toast.error('Failed to load teacher details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    const teacherLectureIds = teacher.lectures ? teacher.lectures.map(b => l._id || b) : [];
    setSelectedLectureIds(teacherLectureIds);
    editForm.setFieldsValue({
      name: teacher.name,
      email: teacher.email,
      teacherCode: teacher.teacherCode,
      phone: teacher.phone || '',
    });
  };

  const handleEditSubmit = async (values) => {
    // Validate lectures
    if (selectedLectureIds.length === 0) {
      toast.error('Please assign at least one lecture to the teacher');
      return;
    }

    try {
      const { name, email, teacherCode, phone } = values;
      const response = await axios.put(`/admin/teachers/${teacherId || teacher._id}`, {
        name,
        email,
        teacherCode,
        phone,
        lectures: selectedLectureIds
      });

      if (response.data.success) {
        toast.success('Teacher details updated successfully');
        // Refresh teacher data to get updated lectures
        if (!isModal && !teacherDataProp) {
          fetchTeacherDetails();
        } else {
          // Update local state
          const updatedLectures = allLectures.filter(b => selectedLectureIds.includes(l._id));
          setTeacher({
            ...teacher,
            name,
            email,
            teacherCode,
            phone,
            lectures: updatedLectures
          });
        }
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update teacher details');
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setSelectedLectureIds([]);
    editForm.resetFields();
  };

  const handleLectureToggle = (lectureId) => {
    setSelectedLectureIds(prev =>
      prev.includes(lectureId)
        ? prev.filter(id => id !== lectureId)
        : [...prev, lectureId]
    );
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${teacher?.name}?`)) return;

    try {
      await axios.delete(`/admin/teachers/${teacherId || teacher._id}`);
      toast.success('Teacher deleted successfully');
      if (isModal && onClose) {
        onClose();
      } else {
        navigate('/admin/teachers');
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!teacher) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-500">Teacher not found</div>
      </div>
    );
  }

  const content = (
    <div className={isModal ? "" : "container mx-auto px-4 py-6"}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4 md:p-6 relative">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Teacher Details</h2>
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
                  {teacher.name.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{teacher.name}</h4>
                <p className="text-sm text-gray-500">{teacher.teacherCode}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <div className="flex items-center text-gray-900">
                  <Mail size={16} className="mr-2 text-gray-400" />
                  {teacher.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <div className="text-gray-900">{teacher.phone || 'N/A'}</div>
              </div>
            </div>

            {/* Lectures Section */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Assigned Lectures</label>
              {teacher.lectures && teacher.lectures.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {teacher.lectures.map((lecture) => (
                    <span
                      key={lecture._id || lecture}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {lecture.name || lecture}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No lectures assigned</p>
              )}
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                <div className="text-gray-900 text-sm">
                  {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <div className="text-gray-900 text-sm">
                  {teacher.updatedAt ? new Date(teacher.updatedAt).toLocaleDateString('en-US', {
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
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
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
          className="teacher-detail-modal"
        >
          {content}
        </Modal>

        {/* Edit Teacher Details Modal */}
        <Modal
          title="Edit Teacher Details"
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
              rules={[{ required: true, message: 'Please enter teacher name' }]}
            >
              <Input placeholder="Enter teacher's full name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="teacher@example.com" />
            </Form.Item>

            <Form.Item
              name="teacherCode"
              label="Teacher Code"
              rules={[{ required: true, message: 'Please enter teacher code' }]}
            >
              <Input placeholder="e.g. TCH12345" />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Lectures <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {allLectures.map((lecture) => (
                  <div key={lecture._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`lecture-${lecture._id}`}
                      checked={selectedLectureIds.includes(lecture._id)}
                      onChange={() => handleLectureToggle(lecture._id)}
                      className="mr-2"
                    />
                    <label htmlFor={`lecture-${lecture._id}`} className="cursor-pointer">
                      {lecture.name}
                    </label>
                  </div>
                ))}
              </div>
              {selectedLectureIds.length === 0 && (
                <p className="text-red-500 text-xs mt-1">Please assign at least one lecture</p>
              )}
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
      </>
    );
  }

  return (
    <>
      {content}

      {/* Edit Teacher Details Modal */}
      <Modal
        title="Edit Teacher Details"
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
            rules={[{ required: true, message: 'Please enter teacher name' }]}
          >
            <Input placeholder="Enter teacher's full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="teacher@example.com" />
          </Form.Item>

          <Form.Item
            name="teacherCode"
            label="Teacher Code"
            rules={[{ required: true, message: 'Please enter teacher code' }]}
          >
            <Input placeholder="e.g. TCH12345" />
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Lectures <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
              {allLectures.map((lecture) => (
                <div key={lecture._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`lecture-page-${lecture._id}`}
                    checked={selectedLectureIds.includes(lecture._id)}
                    onChange={() => handleLectureToggle(lecture._id)}
                    className="mr-2"
                  />
                  <label htmlFor={`lecture-page-${lecture._id}`} className="cursor-pointer">
                    {lecture.name}
                  </label>
                </div>
              ))}
            </div>
            {selectedLectureIds.length === 0 && (
              <p className="text-red-500 text-xs mt-1">Please assign at least one lecture</p>
            )}
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
    </>
  );
};

export default TeacherDetails;
