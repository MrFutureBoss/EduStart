import { Alert } from "antd";

const ErrorAlerts = ({ fullClassUsers, errorMessages, failedEmails }) => {
  return (
    <>
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
          />
        </div>
      )}

      {errorMessages && errorMessages.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <Alert
            message="Lỗi khi thêm người dùng"
            description={
              <ul>
                {errorMessages.map((err, index) => (
                  <li key={index}>
                    <strong>{err.email}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            closable
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
          />
        </div>
      )}
    </>
  );
};

export default ErrorAlerts;
