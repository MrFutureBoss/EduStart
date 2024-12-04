// UploadFileModal.js
import React, { useState } from "react";
import {
  Modal,
  Button,
  Upload,
  Select,
  message,
  notification,
  Table,
} from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import {
  setRecentlyUpdatedUsers,
  setRoleSelect,
} from "../../redux/slice/UserSlice";
import {
  setErrorMessages,
  setFailedEmails,
  setFullClassUsers,
  setErrorFileUrl,
  setGeneralError, // Thêm action để set generalError
  clearGeneralError,
  clearErrorMessages, // Thêm action để clear generalError
} from "../../redux/slice/ErrorSlice";
import * as XLSX from "xlsx"; // Import thư viện xlsx

const { Option } = Select;

const roles = [
  {
    id: 4,
    name: "Sinh viên",
    template: "/templatesExcel/student_template.xlsx",
  },
  {
    id: 2,
    name: "Giáo viên",
    template: "/templatesExcel/teacher_template.xlsx",
  },
  {
    id: 3,
    name: "Người hướng dẫn",
    template: "/templatesExcel/mentor_template.xlsx",
  },
  {
    id: 5,
    name: "Người dùng khác",
    template: "/templatesExcel/other_user_template.xlsx",
  },
];

const UploadFileModal = ({ visible, onCancel, semesterId, refreshData }) => {
  const jwt = localStorage.getItem("jwt");
  const dispatch = useDispatch();
  const { selectedRole } = useSelector((state) => state.user);
  const [selectedFile, setSelectedFile] = useState(null); // File đã chọn
  const [isUploading, setIsUploading] = useState(false); // Trạng thái đang upload
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false); // Trạng thái hiển thị modal xác nhận
  const [proposedClassChanges, setProposedClassChanges] = useState([]); // Danh sách thay đổi lớp đề xuất

  const handleDownloadTemplate = () => {
    const role = roles.find((r) => r.id === selectedRole);
    if (role) {
      // Tải file mẫu bằng cách tạo một liên kết và click vào nó
      const link = document.createElement("a");
      link.href = role.template;
      link.download = `${role.name}_template.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      message.error("Vui lòng chọn vai trò để tải mẫu.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      message.error("Vui lòng chọn file để tải lên.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("role", selectedRole);
    formData.append("semesterId", semesterId);

    setIsUploading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/admins/import-users`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: `Bearer ${jwt}`,
          },
          onUploadProgress: ({ total, loaded }) => {
            const percent = Math.round((loaded / total) * 100);
            console.log(`Upload progress: ${percent}%`);
          },
        }
      );

      console.log("Phản hồi từ backend:", response.data);

      const responseData = response.data;

      if (
        responseData.success === false &&
        responseData.proposedClassChanges &&
        responseData.proposedClassChanges.length > 0
      ) {
        // Có các thay đổi lớp cần xác nhận
        setProposedClassChanges(responseData.proposedClassChanges);
        setIsConfirmModalVisible(true); // Hiển thị modal xác nhận
        // Không đóng modal chính (onCancel) vì cần người dùng xác nhận
        // Hiển thị thông báo nếu cần
        notification.info({
          message: "Có các thay đổi lớp cần xác nhận",
          description:
            responseData.message || "Vui lòng xác nhận các thay đổi lớp.",
          duration: 5,
        });
        return; // Dừng xử lý tiếp
      }

      if (responseData.success === false) {
        // Có lỗi xảy ra
        if (responseData.generalError) {
          // Xử lý lỗi định dạng file
          dispatch(setGeneralError(responseData.generalError));
          notification.error({
            message: "Định dạng file không hợp lệ",
            description: responseData.generalError,
            duration: 10,
          });
        }
        if (responseData.successCount === 0) {
          // Xử lý lỗi định dạng file
          notification.info({
            message: "Không có thay đổi nào được cập nhật sau khi tải file",
            duration: 10,
          });
        }
        if (
          responseData.errorMessages &&
          responseData.errorMessages.length > 0
        ) {
          // Xử lý các lỗi dữ liệu chi tiết
          dispatch(setErrorMessages(responseData.errorMessages));
          notification.warning({
            message: "Lỗi khi thêm người dùng",
            description: `${responseData.errorMessages.length} lỗi xảy ra.`,
            duration: 10,
          });
        }

        if (responseData.failedEmails) {
          // Xử lý các email không gửi được
          dispatch(setFailedEmails(responseData.failedEmails));
        }
        // Không đóng modal, để người dùng có thể sửa
        return;
      }

      // Nếu success === true, tiếp tục xử lý
      const {
        successCount = 0,
        duplicateEmails = [],
        duplicateRollNumbers = [],
        duplicateMemberCodes = [],
        fullClassUsers = [],
        failedEmails = [],
        errorMessages = [],
        usersToInsert = [],
      } = responseData;

      // Xử lý các người dùng không liên quan đến thay đổi lớp
      // Dispatch các hành động cần thiết
      if (usersToInsert && usersToInsert.length > 0) {
        dispatch(
          setRecentlyUpdatedUsers(usersToInsert.map((user) => user._id))
        );
      }
      dispatch(setErrorMessages(errorMessages));
      dispatch(setFullClassUsers(fullClassUsers));
      dispatch(setFailedEmails(failedEmails));
      refreshData();

      if (successCount > 0) {
        notification.success({
          message: "Upload thành công",
          description: `${successCount} người dùng đã được thêm thành công.`,
          duration: 5,
        });
      }

      if (
        duplicateEmails.length > 0 ||
        duplicateRollNumbers.length > 0 ||
        duplicateMemberCodes.length > 0 ||
        fullClassUsers.length > 0 ||
        errorMessages.length > 0 ||
        failedEmails.length > 0
      ) {
        notification.warning({
          message: "Có một số lỗi",
          description: `${duplicateEmails.length} email trùng, ${duplicateRollNumbers.length} mã số sinh viên trùng, ${duplicateMemberCodes.length} mã thành viên trùng, ${fullClassUsers.length} người dùng không thể thêm vào lớp vì lớp đã đầy.`,
          duration: 10,
        });

        // Tạo file lỗi nếu có errorMessages
        if (errorMessages.length > 0) {
          const workbook = XLSX.utils.book_new();
          const worksheetData = [
            ["Email", "Row Number", "Lỗi"],
            ...errorMessages.map((error) => [
              error.email || "",
              error.rowNumber || "",
              error.message || "",
            ]),
          ];
          const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
          XLSX.utils.book_append_sheet(workbook, worksheet, "Errors");
          const wbout = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
          });
          const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const url = URL.createObjectURL(blob);
          dispatch(setErrorFileUrl(url));
        }
      }

      onCancel(); // Đóng modal chính sau khi upload thành công hoặc có lỗi

      // Reset các state liên quan
      setSelectedFile(null);
    } catch (error) {
      console.error("Lỗi khi upload file:", error);

      const errorData = error.response?.data;

      if (errorData) {
        if (errorData.generalError) {
          // Xử lý lỗi định dạng file
          dispatch(setGeneralError(errorData.generalError));
          notification.error({
            message: "Định dạng file không hợp lệ",
            description: errorData.generalError,
            duration: 10,
          });
        }

        if (errorData.errorMessages) {
          // Xử lý các lỗi dữ liệu chi tiết
          dispatch(setErrorMessages(errorData.errorMessages));
          notification.warning({
            message: "Lỗi khi thêm người dùng",
            description: `${errorData.errorMessages.length} lỗi xảy ra.`,
            duration: 10,
          });
        }

        if (errorData.failedEmails) {
          // Xử lý các email không gửi được
          dispatch(setFailedEmails(errorData.failedEmails));
        }
      } else {
        // Xử lý lỗi không xác định
        dispatch(setGeneralError("Đã xảy ra lỗi không xác định."));
        notification.error({
          message: "Upload thất bại",
          description: "Đã xảy ra lỗi không xác định.",
          duration: 10,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmChanges = async () => {
    setIsUploading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/admins/apply-class-changes`, // Đường dẫn endpoint applyClassChanges
        {
          classChanges: proposedClassChanges,
          semesterId: semesterId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${jwt}`,
          },
        }
      );

      console.log("Phản hồi từ apply-class-changes:", response.data);

      const {
        success,
        message: responseMessage,
        errorMessages,
      } = response.data;

      if (success) {
        notification.success({
          message: "Xác nhận thay đổi lớp thành công",
          description: responseMessage,
          duration: 5,
        });
        refreshData(); // Cập nhật lại dữ liệu nếu cần
      } else {
        notification.error({
          message: "Xác nhận thay đổi lớp thất bại",
          description: responseMessage || "Đã có lỗi xảy ra.",
          duration: 10,
        });
      }

      if (errorMessages && errorMessages.length > 0) {
        dispatch(setErrorMessages(errorMessages));
        notification.warning({
          message: "Một số thay đổi lớp không được áp dụng",
          description: `${errorMessages.length} thay đổi lớp không thành công.`,
          duration: 10,
        });

        // Tạo file lỗi nếu có errorMessages
        const workbook = XLSX.utils.book_new();
        const worksheetData = [
          ["User ID", "Lỗi"],
          ...errorMessages.map((error) => [
            error.userId || "",
            error.message || "",
          ]),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Errors");
        const wbout = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        dispatch(setErrorFileUrl(url));
      }

      // Đóng modal xác nhận sau khi xử lý xong
      setIsConfirmModalVisible(false);
      setProposedClassChanges([]);
    } catch (error) {
      console.error("Lỗi khi áp dụng thay đổi lớp:", error);
      notification.error({
        message: "Áp dụng thay đổi lớp thất bại",
        description: "Đã xảy ra lỗi khi áp dụng thay đổi lớp.",
        duration: 10,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelConfirm = () => {
    setIsConfirmModalVisible(false);
    setProposedClassChanges([]);
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isExcel =
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel";
      const isLt5M = file.size / 1024 / 1024 < 5; // Kích thước file dưới 5MB

      if (!isExcel) {
        message.error("Bạn chỉ có thể tải lên file Excel!");
      }
      if (!isLt5M) {
        message.error("Kích thước file phải dưới 5MB!");
      }

      if (isExcel && isLt5M) {
        setSelectedFile(file); // Lưu file đã chọn vào state
        // Không tự động gọi handleViewSelectedFile ở đây
      }

      return false; // Ngăn không cho tự động upload
    },
    onRemove: () => {
      setSelectedFile(null);
      dispatch(setErrorFileUrl(null)); // Xóa errorFileUrl khi loại bỏ file
      dispatch(clearGeneralError()); // Xóa generalError khi loại bỏ file
      dispatch(clearErrorMessages()); // Xóa errorMessages khi loại bỏ file
    },
    fileList: selectedFile ? [selectedFile] : [],
  };

  // Cấu hình cột cho bảng hiển thị thay đổi lớp
  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "MSSV",
      dataIndex: "rollNumber",
      key: "rollNumber",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Lớp Hiện Tại",
      dataIndex: "oldClassName",
      key: "oldClassName",
    },
    {
      title: "Lớp Mới",
      dataIndex: "newClassName",
      key: "newClassName",
    },
  ];
  const countClassChanges = () => proposedClassChanges.length;

  return (
    <>
      <Modal
        title="Tải file người dùng"
        visible={visible}
        onCancel={onCancel}
        footer={[
          <Button key="back" onClick={onCancel}>
            Hủy
          </Button>,
          <Button
            key="upload"
            type="primary"
            onClick={handleUpload}
            disabled={!selectedFile}
            loading={isUploading}
          >
            Tải lên
          </Button>,
        ]}
        width={800}
        style={{ maxHeight: "70vh" }}
        bodyStyle={{ overflowY: "auto" }}
      >
        {/* Kiểm tra nếu selectedRole đã tồn tại */}
        {!selectedRole ? (
          <div style={{ marginBottom: "15px" }}>
            <Select
              placeholder="Chọn vai trò người dùng"
              style={{ width: "100%" }}
              onChange={(value) => {
                dispatch(setRoleSelect(value));
                setSelectedFile(null);
                dispatch(setErrorFileUrl(null));
                dispatch(clearGeneralError());
                dispatch(clearErrorMessages());
              }}
              value={selectedRole}
            >
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </div>
        ) : (
          <div style={{ marginBottom: "15px" }}>
            <p>Vai trò: {roles.find((r) => r.id === selectedRole)?.name}</p>
          </div>
        )}

        {selectedRole && (
          <div
            style={{
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
              style={{ marginBottom: "15px" }}
            >
              Tải mẫu Excel cho {roles.find((r) => r.id === selectedRole)?.name}
            </Button>
          </div>
        )}
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>Chọn file để tải lên</Button>
        </Upload>
      </Modal>

      {/* Modal xác nhận thay đổi lớp */}
      <Modal
        title="Xác Nhận Thay Đổi Lớp"
        visible={isConfirmModalVisible}
        onCancel={handleCancelConfirm}
        footer={[
          <Button key="cancel" onClick={handleCancelConfirm}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmChanges}
            loading={isUploading}
          >
            Xác nhận
          </Button>,
        ]}
        width={800}
      >
        <p>
          Có tổng cộng <b style={{ color: "#3baeb6" }}>{countClassChanges()}</b>{" "}
          sinh viên có sự thay đổi lớp. Bạn có muốn áp dụng các thay đổi này
          không?
        </p>
        <Table
          dataSource={proposedClassChanges}
          columns={columns}
          rowKey={(record) => record.userId}
          pagination={{ pageSize: 5 }}
        />
      </Modal>
    </>
  );
};

export default UploadFileModal;
