import React, { useState, useEffect } from "react";
import { Form, Input, Select, Checkbox, Button, message } from "antd";
import "./UserInformationForm.css";

const { Option } = Select;

const UserInformationForm = ({ userId, refreshData }) => {
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [form] = Form.useForm();

  const fixedUserData = {
    name: "John Doe",
    studentId: "12345678",
    gender: "male",
    email: "johndoe@example.com",
  };

  useEffect(() => {
    // Preload fixed user data
    form.setFieldsValue(fixedUserData);
  }, [form]);

  const handleSaveChanges = async () => {
    try {
      const values = form.getFieldsValue();
      // API call to save changes
      const response = await fetch(`/api/users/update/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success("User information updated successfully!");
        refreshData();
      } else {
        message.error("Failed to update user information.");
      }
    } catch (error) {
      message.error("Error updating user information.");
    }
  };

  return (
    <div className="user-info-form-container">
      <h2 className="form-title">Update User Information</h2>
      <Form
        form={form}
        layout="vertical"
        className="user-info-form"
        initialValues={fixedUserData}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter your name" }]}
        >
          <Input placeholder="Enter your name" />
        </Form.Item>

        <Form.Item
          label="Student ID"
          name="studentId"
          rules={[{ required: true, message: "Please enter your Student ID" }]}
        >
          <Input placeholder="Enter your Student ID" />
        </Form.Item>

        <Form.Item
          label="Gender"
          name="gender"
          rules={[{ required: true, message: "Please select your gender" }]}
        >
          <Select placeholder="Select your gender">
            <Option value="male">Male</Option>
            <Option value="female">Female</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input disabled placeholder="Email (read-only)" />
        </Form.Item>

        <Checkbox
          onChange={(e) => setIsCheckboxChecked(e.target.checked)}
          className="confirm-checkbox"
        >
          I confirm the changes are correct
        </Checkbox>

        <Form.Item>
          <Button
            type="primary"
            onClick={handleSaveChanges}
            disabled={!isCheckboxChecked}
            className="save-button"
          >
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UserInformationForm;
