import React from "react";
import { Modal, Input, Button, Typography, Form, Steps } from "antd";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setForgotPassword } from "../../redux/slice/UserSlice.js";
import OtpInput from "./OtpInput.jsx";
import { BASE_URL } from "../../utilities/initalValue.js";
import {
  showAutoCloseAlert,
  showErrorAlert,
} from "../../components/SweetAlert/index.js";

const { Step } = Steps;

const ForgotPasswordModal = ({ visible, onCancel }) => {
  const dispatch = useDispatch();
  const { email, otp, newPassword, confirmPassword, step } = useSelector(
    (state) => state.user.forgotPassword
  );

  const resetState = () => {
    dispatch(
      setForgotPassword({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
        step: 1,
      })
    );
  };

  const handleCancel = () => {
    resetState();
    onCancel();
  };

  const handleSendOtp = async () => {
    try {
      await axios.post(BASE_URL + "/user/forgot_password", { email });
      dispatch(setForgotPassword({ step: 2 }));
      showAutoCloseAlert(
        "OTP đã được gửi!",
        "Vui lòng kiểm tra email của bạn."
      );
    } catch (error) {
      showErrorAlert(
        "Tài khoản không có trong hệ thống!",
        "Vui lòng kiểm tra lại email của bạn."
      );
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      showErrorAlert("Mật khẩu không khớp!", "Vui lòng kiểm tra lại.");
      return;
    }

    try {
      await axios.post(BASE_URL + "/user/reset_password", {
        email,
        otp,
        newPassword,
      });

      showAutoCloseAlert(
        "Đặt lại mật khẩu thành công!",
        "Bạn có thể đăng nhập bằng mật khẩu mới."
      );
      handleCancel();
    } catch (error) {
      showErrorAlert(
        "OTP không chính xác!",
        "OTP không chính xác hoặc đã hết hạn. Vui lòng thử lại!"
      );
    }
  };

  const handleEmailChange = (e) => {
    dispatch(setForgotPassword({ email: e.target.value }));
  };

  const handleOtpSubmit = (combinedOtp) => {
    dispatch(setForgotPassword({ otp: combinedOtp }));
  };

  const handleNewPasswordChange = (e) => {
    dispatch(setForgotPassword({ newPassword: e.target.value }));
  };

  const handleConfirmPasswordChange = (e) => {
    dispatch(setForgotPassword({ confirmPassword: e.target.value }));
  };

  return (
    <Modal
      style={{ marginTop: "6%" }}
      open={visible}
      title="Quên mật khẩu"
      onCancel={handleCancel}
      footer={null}
    >
      {/* Component Steps với 2 bước */}
      <Steps current={step - 1}>
        <Step title="Nhập Email" />
        <Step title="Xác nhận OTP & Đổi mật khẩu" />
      </Steps>

      {/* Bước 1: Nhập Email */}
      {step === 1 && (
        <Form onFinish={handleSendOtp}>
          <Typography.Text>
            Để thực hiện đổi mật khẩu, vui lòng nhập email của bạn
          </Typography.Text>
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Vui lòng nhập email!" }]}
            style={{ marginTop: "16px" }}
          >
            <Input
              placeholder="Nhập email..."
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              block
              htmlType="submit"
              style={{ marginTop: "16px" }}
            >
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      )}

      {/* Bước 2: Nhập OTP và đổi mật khẩu */}
      {step === 2 && (
        <Form onFinish={handleResetPassword}>
          <Typography.Text>
            Nhập OTP đã được gửi tới email của bạn và đặt lại mật khẩu
          </Typography.Text>
          <OtpInput length={6} onOtpSubmit={handleOtpSubmit} />

          <Form.Item
            name="newPassword"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới!" }]}
            style={{ marginTop: "16px" }}
          >
            <Input.Password
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={handleNewPasswordChange}
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp!")
                  );
                },
              }),
            ]}
            style={{ marginTop: "16px" }}
          >
            <Input.Password
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              block
              htmlType="submit"
              style={{ marginTop: "16px" }}
            >
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;
