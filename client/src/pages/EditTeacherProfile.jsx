import React, { useState } from 'react';
import { Form, Input, Button, Avatar, Modal } from 'antd';

const EditTeacherProfile = () => {
  // Dữ liệu từ API
  const userData = {
    _id: "66f2d968b871895d857e1ab4",
    username: "HieuDT46",
    email: "HieuDT46@fpt.edu.vn",
    phoneNumber: "0289809734",
    role: 2,
    gender: true,
    status: "Active"
  };

  // State for managing phone number and edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(userData.phoneNumber);

  // Handle edit button click to toggle edit mode
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Handle confirmation and save
  const handleSaveChanges = () => {
    Modal.confirm({
        title: 'Confirm Changes',
        content: 'Are you sure you want to save the changes?',
        okText: 'Yes',
        cancelText: 'No',
        okButtonProps: {
          type: 'primary',
          style: { width: '120px' },  // Same width for the Yes button
        },
        cancelButtonProps: {
          type: 'primary', // Default style for the No button, also matching width
          style: { width: '120px' },
        },
        onOk() {
          console.log('Changes confirmed');
        },
    });
  };
  

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      backgroundColor: '#f8f9fa', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div style={{ 
        width: '900px', 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        {/* Left Section: Profile Picture */}
        <div style={{ width: '35%', textAlign: 'center' }}>
          <h2 style={{ textAlign: 'left', color: '#007bff', marginBottom: '20px' }}>Edit Profile</h2>
          <div style={{ marginBottom: '20px' }}>
            <Avatar 
              size={150} 
              src="https://static.vecteezy.com/system/resources/previews/021/770/056/non_2x/avatar-of-a-student-character-free-vector.jpg" 
            />
          </div>
        </div>

        {/* Right Section: Personal Info Form */}
        <div style={{ width: '60%' }}>
          <Form layout="vertical">
            {/* Username field - read-only */}
            <Form.Item
              label="Username"
              name="username"
            >
              <Input defaultValue={userData.username} disabled />
            </Form.Item>

            {/* Email field - read-only */}
            <Form.Item
              label="Email"
              name="email"
            >
              <Input defaultValue={userData.email} disabled />
            </Form.Item>

            {/* Phone number field */}
            <Form.Item
              label="Phone Number"
              name="phoneNumber"
              rules={[{ required: true, message: 'Please input your phone number!' }]}
            >
              <Input 
                defaultValue={userData.phoneNumber}
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                disabled={!isEditing}
              />
            </Form.Item>

            {/* Buttons */}
            <Form.Item>
              {isEditing ? (
                <Button type="primary" onClick={handleSaveChanges}>
                  Save Changes
                </Button>
              ) : (
                <Button type="primary" onClick={handleEditClick}>
                  Edit
                </Button>
              )}
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditTeacherProfile;
