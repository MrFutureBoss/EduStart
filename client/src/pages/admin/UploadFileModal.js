// UploadFileModal.js
import React, { useState } from "react";
import { Modal, Button, Upload, Select, message, notification } from "antd";
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
            // Có thể thêm progress bar nếu muốn
          },
        }
      );

      const {
        successCount,
        duplicateEmails,
        duplicateRollNumbers,
        duplicateMemberCodes,
        fullClassUsers,
        failedEmails,
        errorMessages,
        usersToInsert,
      } = response.data;

      // Dispatch các hành động cần thiết
      dispatch(setRecentlyUpdatedUsers(usersToInsert.map((user) => user._id)));
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
          description: `${duplicateEmails.length} email trùng, ${duplicateRollNumbers.length} mã số sinh viên trùng, ${duplicateMemberCodes.length} mã thành viên trùng, ${fullClassUsers.length} người dùng không thể thêm vào lớp vì lớp đã đầy, và ${errorMessages.length} lỗi khác.`,
          duration: 10,
        });

        // Tạo file lỗi nếu có errorMessages
        if (errorMessages.length > 0) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            // Chuyển đổi worksheet thành mảng các dòng
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: "",
            });

            // Thêm cột lỗi nếu chưa có
            if (!jsonData[0].includes("Lỗi")) {
              jsonData[0].push("Lỗi");
            }

            // Tạo một mảng để lưu trữ các lỗi theo số dòng
            const errorsByRow = {};
            errorMessages.forEach((error) => {
              if (error.rowNumber) {
                if (!errorsByRow[error.rowNumber]) {
                  errorsByRow[error.rowNumber] = [];
                }
                errorsByRow[error.rowNumber].push(error.message);
              }
            });

            // Duyệt qua các dòng và thêm thông báo lỗi
            for (let i = 1; i < jsonData.length; i++) {
              const rowNumber = i + 1; // Vì dòng đầu tiên là tiêu đề
              if (errorsByRow[rowNumber]) {
                // Thêm thông báo lỗi vào cột cuối
                jsonData[i].push(errorsByRow[rowNumber].join("; "));
              } else {
                // Thêm cột lỗi trống
                jsonData[i].push("");
              }
            }

            // Tạo workbook và worksheet mới
            const newWorksheet = XLSX.utils.aoa_to_sheet(jsonData);
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

            // Áp dụng style cho các ô có lỗi
            Object.keys(errorsByRow).forEach((rowNumStr) => {
              const rowNum = parseInt(rowNumStr) - 1; // Chuyển đổi về chỉ số mảng
              const colCount = jsonData[0].length;
              for (let colIndex = 0; colIndex < colCount; colIndex++) {
                const cellAddress = XLSX.utils.encode_cell({
                  r: rowNum,
                  c: colIndex,
                });
                const cell = newWorksheet[cellAddress];
                if (cell) {
                  cell.s = {
                    fill: {
                      fgColor: { rgb: "FFC7CE" }, // Màu nền đỏ nhạt
                    },
                    font: {
                      color: { rgb: "9C0006" }, // Chữ đỏ đậm
                    },
                  };
                }
              }
            });

            // Chuyển đổi workbook thành Blob với đúng MIME type cho Excel
            const wbout = XLSX.write(newWorkbook, {
              bookType: "xlsx",
              type: "array",
            });
            const blob = new Blob([wbout], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            // Tạo URL để tải file
            const url = URL.createObjectURL(blob);

            // Lưu trữ URL vào Redux Store
            dispatch(setErrorFileUrl(url));
          };
          reader.readAsArrayBuffer(selectedFile);
        }
      }

      onCancel(); // Đóng modal sau khi upload thành công hoặc có lỗi

      // Reset các state liên quan
      setSelectedFile(null);
    } catch (error) {
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

  return (
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
  );
};

export default UploadFileModal;
