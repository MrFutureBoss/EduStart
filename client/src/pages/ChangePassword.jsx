import React, { useState } from "react";
import { Form, Input, Button, Typography } from "antd";
import axios from "axios";
import { toast } from "react-toastify";
import "./ChangePassword.css"; 

const { Title } = Typography;

const ChangePassword = () => {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:9999/user/change_password", {
        email,
        oldPassword,
        newPassword,
      });

      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error changing password");
    }
  };

  return (
    <div className="change-password-container">
      <Title level={2}>Change Password</Title>
      <Form
        layout="vertical"
        onFinish={handleSubmit}
        className="change-password-form"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Please input your email!" }]}
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          label="Old Password"
          name="oldPassword"
          rules={[{ required: true, message: "Please input your old password!" }]}
        >
          <Input.Password
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[{ required: true, message: "Please input your new password!" }]}
        >
          <Input.Password
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          label="Confirm New Password"
          name="confirmPassword"
          rules={[
            { required: true, message: "Please confirm your new password!" },
          ]}
        >
          <Input.Password
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Change Password
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ChangePassword;
