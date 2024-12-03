import { Alert, Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  clearFailedEmails,
  clearErrorMessages,
  clearFullClassUsers,
  clearErrorFileUrl,
  clearGeneralError, // Thêm action để clear generalError
} from "../../redux/slice/ErrorSlice";

const ErrorAlerts = ({
  fullClassUsers,
  errorMessages,
  failedEmails,
  selectedRole,
}) => {
  const dispatch = useDispatch();
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
  // Lấy errorFileUrl từ Redux Store
  const errorFileUrl = useSelector((state) => state.error.errorFileUrl);
  const generalError = useSelector((state) => state.error.generalError);

  const handleCloseFullClassUsers = () => {
    dispatch(clearFullClassUsers());
  };
  const handleCloseErrorMessages = () => {
    dispatch(clearErrorMessages());
    dispatch(clearErrorFileUrl()); // Xóa errorFileUrl khi đóng cảnh báo
  };
  const handleCloseFailedEmails = () => {
    dispatch(clearFailedEmails());
  };
  const handleCloseGeneralError = () => {
    dispatch(clearGeneralError());
    dispatch(clearErrorFileUrl());
  };

  const handleDownloadErrorFile = () => {
    if (errorFileUrl) {
      // Tạo một liên kết tạm thời để tải file
      const link = document.createElement("a");
      link.href = errorFileUrl;
      link.download = "error_file.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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

  return (
    <>
      {generalError && (
        <div style={{ marginBottom: "20px" }}>
          <Alert
            message="Định dạng file không hợp lệ"
            description={
              <div>
                {generalError}
                <br />
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                  style={{ marginTop: "10px" }}
                >
                  Tải về mẫu Excel đúng
                </Button>
              </div>
            }
            type="error"
            showIcon
            closable
            onClose={handleCloseGeneralError}
          />
        </div>
      )}

      {fullClassUsers && fullClassUsers.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <Alert
            message="Không thể thêm vào lớp"
            description={
              <ul>
                {fullClassUsers.map((user) => (
                  <li key={user.email}>
                    {user.username} ({user.email}) không thể thêm vào lớp vì lớp
                    đã đầy.
                  </li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            closable
            onClose={handleCloseFullClassUsers}
          />
        </div>
      )}

      {errorMessages && errorMessages.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <Alert
            message="Lỗi khi thêm người dùng"
            description={
              <div>
                <ul>
                  {errorMessages.map((err, index) => (
                    <li key={index}>
                      {err.rowNumber && <strong>Dòng {err.rowNumber}:</strong>}{" "}
                      {err.email && (
                        <>
                          <strong>{err.email}:</strong>{" "}
                        </>
                      )}
                      {err.message}
                    </li>
                  ))}
                </ul>
                {errorFileUrl && (
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadErrorFile}
                    style={{ marginTop: "10px" }}
                  >
                    Tải về file lỗi
                  </Button>
                )}
              </div>
            }
            type="error"
            showIcon
            closable
            onClose={handleCloseErrorMessages}
          />
        </div>
      )}

      {failedEmails && failedEmails.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <Alert
            message="Không thể gửi email"
            description={
              <ul>
                {failedEmails.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            closable
            onClose={handleCloseFailedEmails}
          />
        </div>
      )}
    </>
  );
};

export default ErrorAlerts;
