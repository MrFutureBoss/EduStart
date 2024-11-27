import React, { useState, useEffect } from "react";
import { Avatar, Button,Input, Layout, Menu, Card, Typography, Divider, message } from "antd";
import { UserOutlined, LockOutlined, EditOutlined, SaveOutlined, FileAddOutlined } from "@ant-design/icons";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("Hồ sơ");
  const [userData, setUserData] = useState(null);
  const [changeRequestData, setChangeRequestData] = useState({ field: "", newValue: "", reason: "" });
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("jwt");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:9999/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserData(response.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu người dùng:", error);
      message.error("Không thể tải dữ liệu người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRequestSubmit = async () => {
    try {
      const response = await axios.post(
        `http://localhost:9999/user/change-request`,
        { ...changeRequestData, userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        message.success("Yêu cầu thay đổi đã được gửi thành công!");
        setChangeRequestData({ field: "", newValue: "", reason: "" });
      } else {
        message.error("Không thể gửi yêu cầu thay đổi.");
      }
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu thay đổi:", error);
      message.error("Không thể gửi yêu cầu thay đổi.");
    }
  };

  const renderProfileContent = () => {
    if (!userData) return <p>Đang tải...</p>;

    return (
      <Card
        title={<Title level={4} className="text-center">Hồ sơ cá nhân</Title>}
        bordered={false}
        style={{
          maxWidth: 600,
          margin: "20px auto",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#f9f9f9",
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="fw-bold">Tên người dùng</span>
          <Text>{userData.username}</Text>
        </div>
        <Divider />
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="fw-bold">Email</span>
          <Text>{userData.email}</Text>
        </div>
      </Card>
    );
  };

  const renderChangeRequestForm = () => {
    return (
      <Card
        title={<Title level={4} className="text-center">Yêu cầu thay đổi thông tin</Title>}
        bordered={false}
        style={{
          maxWidth: 600,
          margin: "20px auto",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#f9f9f9",
        }}
      >
        <div className="mb-3">
          <label className="form-label">Trường cần thay đổi</label>
          <Input
            placeholder="Nhập trường thông tin cần thay đổi (VD: tên người dùng, email)"
            value={changeRequestData.field}
            onChange={(e) => setChangeRequestData({ ...changeRequestData, field: e.target.value })}
          />
        </div>
        <Divider />
        <div className="mb-3">
          <label className="form-label">Giá trị mới</label>
          <Input
            placeholder="Nhập giá trị mới cho trường"
            value={changeRequestData.newValue}
            onChange={(e) => setChangeRequestData({ ...changeRequestData, newValue: e.target.value })}
          />
        </div>
        <Divider />
        <div className="mb-3">
          <label className="form-label">Lý do thay đổi</label>
          <Input.TextArea
            placeholder="Giải thích lý do thay đổi"
            rows={4}
            value={changeRequestData.reason}
            onChange={(e) => setChangeRequestData({ ...changeRequestData, reason: e.target.value })}
          />
        </div>
        <Button type="primary" className="w-100 mt-3" onClick={handleChangeRequestSubmit}>
          Gửi yêu cầu thay đổi
        </Button>
      </Card>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={250} theme="light">
        <div className="p-4 text-center">
          <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: "#87d068" }} />
          <Title level={4} className="mt-3">{userData ? userData.username : "Đang tải..."}</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeTab]}
          onClick={({ key }) => setActiveTab(key)}
          items={[
            { key: "Hồ sơ", icon: <UserOutlined />, label: "Hồ sơ cá nhân" },
            { key: "Thay đổi thông tin", icon: <FileAddOutlined />, label: "Thay đổi thông tin" },
          ]}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: "30px 50px" }}>
          {activeTab === "Hồ sơ" && renderProfileContent()}
          {activeTab === "Thay đổi thông tin" && renderChangeRequestForm()}
        </Content>
      </Layout>
    </Layout>
  );
}
