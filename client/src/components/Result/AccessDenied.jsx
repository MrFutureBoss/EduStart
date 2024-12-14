import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="403"
      subTitle="Xin lỗi, bạn không có quyền để truy cập trang này."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Quay lại đăng nhập
        </Button>
      }
    />
  );
};

export default AccessDenied;
