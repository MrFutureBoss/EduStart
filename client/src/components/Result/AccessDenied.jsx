import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Back to Login
        </Button>
      }
    />
  );
};

export default AccessDenied;
