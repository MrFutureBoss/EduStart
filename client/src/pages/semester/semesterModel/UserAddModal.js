import React from "react";
import { Modal, Form, Input, Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../../../utilities/initalValue";
import {
  setCounts,
  setCurrentSemester,
  setSemesterName,
  setSid,
  setUsersInSmt,
} from "../../../redux/slice/semesterSlide";
import {
  showSuccessAlert,
  showErrorAlert,
  showWarningAlert,
} from "../../../components/SweetAlert";
import { setRecentlyUpdatedUsers } from "../../../redux/slice/UserSlice";

const jwt = localStorage.getItem("jwt");

const config = {
  headers: {
    "Content-Type": "application/json",
    authorization: `Bearer ${jwt}`,
  },
};

const UserAddModal = ({ visible, onOk, onCancel, semesterId }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const role = useSelector((state) => state.user.selectedRole); // Lấy role từ Redux
  const [majorOptions, setMajorOptions] = React.useState([]);

  // Auto-fill email when memberCode changes
  const handleMemberCodeChange = (e) => {
    const value = e.target.value.trim().toLowerCase();
    if (value) {
      const email = `${value}@fpt.edu.vn`;
      form.setFieldsValue({ email, memberCode: value });
    } else {
      form.setFieldsValue({ email: "" });
    }
  };
  const majorsByCode = {
    HE: [
      "Kỹ thuật phần mềm",
      "Trí tuệ nhân tạo",
      "An toàn thông tin",
      "Thiết kế vi mạch bán dẫn",
      "Thiết kế mỹ thuật số",
    ],
    SE: [
      "Tài chính",
      "Digital Marketing",
      "Kinh doanh quốc tế",
      "Quản trị khách sạn",
    ],
    GD: ["Truyền thông đa phương tiện", "Quan hệ công chúng"],
    HA: ["Ngôn ngữ Anh", "Ngôn ngữ Nhật", "Ngôn ngữ Trung", "Ngôn ngữ Hàn"],
  };

  // Handle modal OK with confirmation
  const handleModalOk = () => {
    form
      .validateFields()
      .then(() => {
        // Show confirmation alert
        showWarningAlert(
          "Xác nhận thêm người dùng",
          "Bạn có chắc chắn muốn thêm người dùng này không?"
        ).then((result) => {
          if (result.isConfirmed) {
            submitForm();
          }
        });
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  // Submit form data
  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      const email = role === 4 ? values.email : `${values.email}@fe.edu.vn`;
      const response = await axios.post(
        `${BASE_URL}/admins/add-user-hand`,
        {
          semesterId,
          role,
          userInput: {
            username: values.username,
            rollNumber: values.rollNumber,
            memberCode: values.memberCode,
            Email: email,
            phoneNumber: values.phoneNumber,
            major: values.major, // Thêm ngành học
          },
        },
        config
      );
      const userId = response.data.userId;
      dispatch(setRecentlyUpdatedUsers(userId));

      if (response.status === 201) {
        showSuccessAlert("Thành công", response.data.message);
        onOk();
        await fetchSemesterData();
        form.resetFields();
      }
    } catch (error) {
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          // Handle multiple errors
          error.response.data.errors.forEach((err) => {
            form.setFields([
              {
                name: err.field,
                errors: [err.message],
              },
            ]);
          });
        } else if (error.response.data.field && error.response.data.message) {
          // Handle single error
          const { field, message: errorMessage } = error.response.data;
          form.setFields([
            {
              name: field,
              errors: [errorMessage],
            },
          ]);
        }
      } else {
        showErrorAlert(
          "Lỗi",
          error.message || "Có lỗi xảy ra khi thêm người dùng."
        );
      }
    }
  };

  // Fetch and update semester data
  const fetchSemesterData = async () => {
    try {
      const responses = await axios.get(`${BASE_URL}/semester/current`, config);
      const semester = responses.data;
      dispatch(setSid(semester._id));
      dispatch(setSemesterName(semester.name));
      dispatch(setCurrentSemester(semester));
      dispatch(
        setCounts({
          studentCount: semester.studentCount,
          teacherCount: semester.teacherCount,
          mentorCount: semester.mentorCount,
          classCount: semester.classCount,
          endDate: semester.endDate,
          startDate: semester.startDate,
          semesterName: semester.name,
          status: semester.status,
        })
      );
      const userResponse = await axios.get(
        `${BASE_URL}/semester/${semesterId}/users`,
        config
      );
      dispatch(setUsersInSmt(userResponse.data));
    } catch (error) {
      showErrorAlert("Lỗi", "Không thể lấy dữ liệu học kỳ hiện tại.");
      console.error(error);
    }
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    onCancel();
    form.resetFields();
  };

  // Custom validator for username when role === 4
  const validateUsername = (_, value) => {
    if (role !== 4) {
      if (!value || value.trim() === "") {
        return Promise.reject("Vui lòng nhập tên người dùng!");
      }
      return Promise.resolve();
    }

    if (!value || value.trim() === "") {
      return Promise.reject("Vui lòng nhập họ và tên!");
    }

    const hasConsecutiveUpperCase = /[A-Z]{2,}/.test(value);
    if (hasConsecutiveUpperCase) {
      return Promise.reject(
        "Tên không hợp lệ: Không được có hai chữ cái viết hoa liền kề."
      );
    }

    const formattedValue = value
      .split(" ")
      .map((word) =>
        word.length > 0
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : ""
      )
      .join(" ");
    form.setFieldsValue({ username: formattedValue });

    return Promise.resolve();
  };

  // Custom validator for rollNumber when role === 4
  const validateRollNumber = (_, value) => {
    if (role !== 4) {
      return Promise.resolve();
    }

    if (!value) {
      return Promise.reject("Vui lòng nhập MSSV!");
    }

    const isValid = /^HE\d{6}$|^SE\d{6}$|^GD\d{6}$|^HA\d{6}$/.test(value);
    if (!isValid) {
      return Promise.reject("MSSV phải có định dạng HE/SE/GD/HA + 6 chữ số");
    }

    // Extract prefix to determine majors
    const prefix = value.slice(0, 2);
    setMajorOptions(majorsByCode[prefix] || []);

    return Promise.resolve();
  };

  return (
    <Modal
      title="Thêm người dùng thủ công"
      open={visible}
      onOk={handleModalOk}
      onCancel={handleModalCancel}
      okText="Thêm"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          username: "",
          rollNumber: "",
          memberCode: "",
          Email: "",
          phoneNumber: "",
        }}
      >
        {role === 4 ? (
          <>
            <Form.Item
              name="username"
              label="Họ và tên"
              rules={[
                {
                  validator: validateUsername,
                },
              ]}
              hasFeedback
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="rollNumber"
              label="MSSV"
              rules={[
                {
                  validator: validateRollNumber,
                },
              ]}
              hasFeedback
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="memberCode"
              label="Member Code"
              rules={[
                { required: true, message: "Vui lòng nhập mã thành viên!" },
                {
                  pattern: /^[a-z0-9]+$/,
                  message: "Mã thành viên chỉ chứa chữ thường và số!",
                },
              ]}
              hasFeedback
            >
              <Input onChange={handleMemberCodeChange} />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
              hasFeedback
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="major"
              label="Ngành học"
              rules={[{ required: true, message: "Vui lòng chọn ngành học!" }]}
              hasFeedback
            >
              <Select placeholder="Chọn ngành học">
                {majorOptions.map((major) => (
                  <Select.Option key={major} value={major}>
                    {major}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              name="username"
              label="Tên người dùng"
              rules={[
                { required: true, message: "Vui lòng nhập tên người dùng!" },
              ]}
              hasFeedback
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                {
                  pattern: /^[a-z0-9]+$/,
                  message: "Phần tên email chỉ chứa chữ thường và số!",
                },
              ]}
              hasFeedback
            >
              <Input addonAfter="@fe.edu.vn" />
            </Form.Item>
            <Form.Item
              name="phoneNumber"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Số điện thoại phải gồm 10 chữ số!",
                },
              ]}
              hasFeedback
            >
              <Input maxLength={10} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default UserAddModal;
