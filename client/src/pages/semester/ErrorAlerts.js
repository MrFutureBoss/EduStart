import { Alert, Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  clearFailedEmails,
  clearErrorMessages,
  clearFullClassUsers,
  clearErrorFileUrl,
  clearGeneralError,
} from "../../redux/slice/ErrorSlice";
import { useState } from "react";

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

  const errorFileUrl = useSelector((state) => state.error.errorFileUrl);
  const generalError = useSelector((state) => state.error.generalError);

  const [showFullClassUsers, setShowFullClassUsers] = useState(false);
  const [showErrorMessages, setShowErrorMessages] = useState(false);
  const [showFailedEmails, setShowFailedEmails] = useState(false);

  const handleCloseFullClassUsers = () => {
    dispatch(clearFullClassUsers());
  };
  const handleCloseErrorMessages = () => {
    dispatch(clearErrorMessages());
    dispatch(clearErrorFileUrl());
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
              <div>
                <ul
                  style={{
                    maxHeight: showFullClassUsers ? "fit-content" : "100px",
                    overflow: "hidden",
                    marginBottom: "10px",
                    listStyle: "none",
                    transition: "max-height 0.3s ease-in-out",
                  }}
                >
                  {(showFullClassUsers
                    ? fullClassUsers
                    : fullClassUsers.slice(0, 3)
                  ).map((user) => (
                    <li key={user.email}>
                      {user.username} ({user.email}) không thể thêm vào lớp vì
                      lớp đã đầy.
                    </li>
                  ))}
                </ul>
                {fullClassUsers.length > 3 && (
                  <Button
                    type="link"
                    onClick={() => setShowFullClassUsers(!showFullClassUsers)}
                  >
                    {showFullClassUsers ? "Thu gọn" : "Xem thêm"}
                  </Button>
                )}
              </div>
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
                <ul
                  style={{
                    maxHeight: showErrorMessages ? "fit-content" : "100px",
                    overflow: "hidden",
                    marginBottom: "10px",
                    listStyle: "none",
                    transition: "max-height 0.3s ease-in-out",
                  }}
                >
                  {(showErrorMessages
                    ? errorMessages
                    : errorMessages.slice(0, 3)
                  ).map((err, index) => (
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
                {errorMessages.length > 3 && (
                  <Button
                    type="link"
                    onClick={() => setShowErrorMessages(!showErrorMessages)}
                  >
                    {showErrorMessages ? "Thu gọn" : "Xem thêm"}
                  </Button>
                )}
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
              <div>
                <ul
                  style={{
                    maxHeight: showFailedEmails ? "fit-content" : "100px",
                    overflow: "hidden",
                    marginBottom: "10px",
                    listStyle: "none",
                    transition: "max-height 0.3s ease-in-out",
                  }}
                >
                  {(showFailedEmails
                    ? failedEmails
                    : failedEmails.slice(0, 3)
                  ).map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
                {failedEmails.length > 3 && (
                  <Button
                    type="link"
                    onClick={() => setShowFailedEmails(!showFailedEmails)}
                  >
                    {showFailedEmails ? "Thu gọn" : "Xem thêm"}
                  </Button>
                )}
              </div>
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
