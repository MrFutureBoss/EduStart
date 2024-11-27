import React, { useState } from "react";
import { Card, Input, Button, Select, message } from "antd";
import "./GeneralRequestForm.css";

const { TextArea } = Input;
const { Option } = Select;

export default function GeneralRequestForm({ userId, refreshData }) {
  const [requestType, setRequestType] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = async () => {
    if (!requestType || !details) {
      message.error("Vui lòng chọn loại yêu cầu và nhập chi tiết.");
      return;
    }

    try {
      const response = await fetch(`/api/requests/general`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, requestType, details }),
      });

      if (response.ok) {
        message.success("Yêu cầu đã được gửi thành công!");
        setRequestType("");
        setDetails("");
        if (refreshData) refreshData();
      } else {
        message.error("Không thể gửi yêu cầu. Thử lại sau.");
      }
    } catch (error) {
      console.error("Error submitting general request:", error);
      message.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  return (
    <Card className="general-request-card">
      <h3 className="form-title">Tạo Yêu Cầu Khác</h3>
      <Select
        placeholder="Chọn loại yêu cầu"
        value={requestType}
        onChange={(value) => setRequestType(value)}
        style={{ width: "100%", marginBottom: "15px" }}
      >
        <Option value="PasswordReset">Đặt Lại Mật Khẩu</Option>
        <Option value="AccountDeactivation">Vô Hiệu Hóa Tài Khoản</Option>
        <Option value="CustomRequest">Yêu Cầu Khác</Option>
      </Select>
      <TextArea
        placeholder="Nhập chi tiết yêu cầu"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={4}
        style={{ marginBottom: "15px" }}
      />
      <Button type="primary" onClick={handleSubmit}>
        Gửi Yêu Cầu
      </Button>
    </Card>
  );
}
