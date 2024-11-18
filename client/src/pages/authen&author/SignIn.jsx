/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setFetchError } from "../../redux/slice/ErrorSlice.js";
import { useEffect } from "react";
import { Card, Row, Col, Button, Input, Typography, Modal } from "antd";
import "../../style/login.css";
import {
  showAutoCloseAlert,
  showErrorAlert,
} from "../../components/SweetAlert/index.js";
import ForgotPasswordModal from "./ForgotPasswordModal.jsx";
import { jwtDecode } from "jwt-decode";
import { triggerTeacherDashboardNotification } from "../../redux/slice/NotificationSlice.js";

function SignIn() {
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);

  const showForgotPasswordModal = () => {
    setForgotPasswordVisible(true);
  };

  const hideForgotPasswordModal = () => {
    setForgotPasswordVisible(false);
  };
  const dispatch = useDispatch();
  const userRegister = useSelector((state) => state.user.userRegister);
  const formValues = {
    email: userRegister.email || "admin@fpt.edu.vn",
    password: userRegister.password || "dIB=UJ]P",
  };
  const fetchError = useSelector((state) => state.error.fetchError);
  const navigation = useNavigate();

  const handleSubmit = async (values, { setFieldError }) => {
    const formData = { ...values };

    try {
      const res = await axios.post(`${BASE_URL}/user/login`, formData);
      const token = res.data.token;
      const role = res.data.user.role;
      const userId = res.data.user._id;
      const username = res.data.user.username;
      if (token) {
        localStorage.setItem("jwt", token);
        localStorage.setItem("role", role);
        localStorage.setItem("userId", userId);
        localStorage.setItem("username", username);
        const decodedToken = jwtDecode(token);
        const userRole = decodedToken.role;

        dispatch(setFetchError(false));
        showAutoCloseAlert(
          "Đăng nhập thành công!",
          "Chào mừng bạn đã trở lại."
        );

        setTimeout(() => {
          console.log("Navigating to Dashboard");
          if (userRole === 1) {
            navigation("/admin/dashboard", { replace: true });
          } else if (userRole === 2) {
            navigation("/teacher-dashboard");
            dispatch(triggerTeacherDashboardNotification());
          } else if (userRole === 4) {
            navigation("/student-dashboard"); // Nếu là học sinh
          } else if (userRole === 3) {
            navigation("/mentor-dashboard"); // Nếu là mentor
          } else {
            navigation("/");
          }
        }, 2000);
      } else {
        setFieldError("email", "Thông tin đăng nhập không chính xác!");
        setFieldError("password", "Thông tin đăng nhập không chính xác!");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.error;
        if (errorMessage === "User not found.") {
          setFieldError("email", "Email không tồn tại!");
        } else if (errorMessage === "Wrong password.") {
          setFieldError("password", "Mật khẩu không chính xác!");
        } else {
          showErrorAlert("Đã xảy ra lỗi!", "Vui lòng thử lại sau.");
        }
      } else {
        dispatch(setFetchError(true));
        showErrorAlert("Đã xảy ra lỗi!", "Vui lòng thử lại sau.");
      }
    }
  };

  useEffect(() => {
    dispatch(setFetchError(false));
  }, [dispatch]);

  const SignupSchema = Yup.object().shape({
    email: Yup.string()
      .required("Vui lòng nhập email!")
      .matches(
        /@(fe\.edu\.vn|fpt\.edu\.vn)$/,
        "Email phải có đuôi @fe.edu.vn hoặc @fpt.edu.vn"
      ),
    password: Yup.string().required("Vui lòng nhập mật khẩu!"),
  });

  const { Title } = Typography;

  return (
    <div className="sign-in-container">
      <div className="sign-in-full-height">
        <Row justify="center" align="middle" style={{ height: "100%" }}>
          <Col xs={22} sm={18} md={12} lg={8} xl={6}>
            <Card className="card-login-body">
              <div className="card-title-login">
                <Title
                  level={2}
                  style={{
                    color: "white",
                    marginTop: "4%",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "3px",
                    fontSize: "1.8rem",
                  }}
                >
                  EduStart
                </Title>
              </div>

              {fetchError && (
                <div className="error-message-response">
                  <div>Email và mật khẩu không chính xác</div>
                </div>
              )}

              <Formik
                initialValues={formValues}
                onSubmit={handleSubmit}
                validationSchema={SignupSchema}
              >
                {({ values, errors, touched }) => (
                  <Form className="form-login">
                    <div>
                      <label htmlFor="email" className="label-login">
                        Email
                      </label>
                      <Field
                        as={Input}
                        type="email"
                        name="email"
                        placeholder="abc@gmail.com"
                        className={`input-email ${
                          touched.email && errors.email ? "error" : ""
                        }`}
                        id="email"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="lg_error_message"
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="label-login">
                        Mật khẩu
                      </label>
                      <Field
                        as={Input.Password}
                        name="password"
                        placeholder="12345678"
                        className={`input-password ${
                          touched.password && errors.password ? "error" : ""
                        }`}
                        id="password"
                      />
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="lg_error_message"
                      />
                    </div>
                    <p
                      onClick={showForgotPasswordModal}
                      className="forgot-password-p"
                    >
                      Quên mật khẩu? Bấm tại đây
                    </p>
                    <Button
                      type="primary"
                      block
                      htmlType="submit"
                      className="login-button"
                    >
                      Đăng nhập
                    </Button>
                  </Form>
                )}
              </Formik>
            </Card>
          </Col>
        </Row>
        <ForgotPasswordModal
          visible={forgotPasswordVisible}
          onCancel={hideForgotPasswordModal}
        />
      </div>
    </div>
  );
}

export default SignIn;
