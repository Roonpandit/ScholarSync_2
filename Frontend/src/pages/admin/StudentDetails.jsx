import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Table, Button, Space, DatePicker, Typography, Spin, Select, Modal, Form, Input } from 'antd';
import { CalendarOutlined, UserOutlined, MailOutlined, PhoneOutlined, EditOutlined } from '@ant-design/icons';
import moment from 'moment';
import { toast } from 'react-toastify'

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const StudentDetails = () => {
  const { studentId } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/students/${studentId}/details`);
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
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    // Set initial values for all fields
    editForm.setFieldsValue({
      name: studentData?.name || '',
      email: studentData?.email || '',
      studentCode: studentData?.studentCode || '',
      phone: studentData?.phone || ''
    });
  };

  const handleEditSubmit = async (values) => {
    try {
      // Only send the fields that can be edited
      const { name, phone } = values;
      const response = await axios.put(`/admin/students/${studentId}`, { name, phone });
      
      if (response.data.success) {
        toast.success('Student details updated successfully');
        setStudentData({ 
          ...studentData, 
          name,
          phone
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
    <div>
      <Card title="Student Details" style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={24} style={{ marginBottom: 16 }}>
            <Space>
              <Button type="primary" onClick={handleEdit}>
                <EditOutlined /> Edit Details
              </Button>
            </Space>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined />
              <Text strong>Name:</Text>
              <Text>{studentData?.student?.name}</Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MailOutlined />
              <Text strong>Email:</Text>
              <Text>{studentData?.student?.email}</Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PhoneOutlined />
              <Text strong>Phone:</Text>
              <Text>{studentData?.student?.phone}</Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarOutlined />
              <Text strong>Student Code:</Text>
              <Text>{studentData?.student?.studentCode}</Text>
            </div>
          </Col>
        </Row>
      </Card>
      
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
          style={{ maxWidth: 600 }}
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
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>

          <Form.Item
            name="studentCode"
            label="Student Code"
          >
            <Input 
              placeholder="e.g. STU12345" 
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
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

      <Card title="Attendance History">
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={4}>Total Days</Title>
              <Text>{attendanceStats.total}</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={4} style={{ color: '#52c41a' }}>Present</Title>
              <Text style={{ color: '#52c41a' }}>{attendanceStats.present}</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={4} style={{ color: '#ff4d4f' }}>Absent</Title>
              <Text style={{ color: '#ff4d4f' }}>{attendanceStats.absent}</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={4}>Attendance Rate</Title>
              <Text>{attendanceStats.total > 0 ? 
                `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%` : 'N/A'}</Text>
            </div>
          </Col>
        </Row>

        <Table dataSource={studentData?.attendance?.records || []} rowKey="_id">
          <Table.Column title="Date" dataIndex="date" key="date" render={date => 
            moment(date).toISOString().split('T')[0]
          } />
          <Table.Column title="Shift" dataIndex="shift" key="shift" />
          <Table.Column title="Status" dataIndex="status" key="status" />
          <Table.Column title="Time" dataIndex="slot" key="time" render={(slot) => 
            slot && `${moment(slot.startTime).format('HH:mm')} - ${moment(slot.endTime).format('HH:mm')}`
          } />
          <Table.Column title="Time" dataIndex="time" key="time" render={time => 
            moment(time).format('HH:mm')
          } />
        </Table>
      </Card>
    </div>
  );
};

export default StudentDetails;
