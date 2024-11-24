import { useState, useEffect } from "react";
import { Avatar, Input, Button, Layout, Menu, Card, Typography, Divider } from "antd";
import { UserOutlined, LockOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const { Sider, Content } = Layout;
const { Title } = Typography;

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [isEditing, setIsEditing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [mentorCategoryData, setMentorCategoryData] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("jwt");
    const userId = localStorage.getItem("userId");
    setUserRole(role);

    if (userId && token) {
      axios
        .get(`http://localhost:9999/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setUserData(response.data);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });

      if (role === "3") {
        axios
          .get(`http://localhost:9999/mentorcategory/findmentorcategorybyuserid/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((response) => {
            setMentorCategoryData(response.data);
          })
          .catch((error) => {
            console.error("Error fetching mentor category data:", error);
          });
      }
    }
  }, []);

  const handleSaveChanges = () => {
    setIsEditing(false);
  };

  const renderProfileContent = () => {
    if (!userData) return <p>Loading...</p>;

    return (
      <Card
        title={<Title level={4} className="text-center">User Profile</Title>}
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
          <span className="fw-bold">Username</span>
          <Input
            defaultValue={userData.username}
            disabled={!isEditing}
            className="rounded"
            style={{ width: "75%" }}
          />
        </div>
        <Divider />
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="fw-bold">Email</span>
          <Input
            defaultValue={userData.email}
            disabled={!isEditing}
            className="rounded"
            style={{ width: "75%" }}
          />
        </div>
        <Divider />
        {userRole === "3" && mentorCategoryData && (
          <>
            <div className="mb-3">
              <span className="fw-bold">Professions</span>
              <ul className="list-group mt-2">
                {mentorCategoryData.professionIds.map((profession) => (
                  <li key={profession._id} className="list-group-item border-0 ps-0">
                    <i className="text-primary me-2">•</i> {profession.name}
                  </li>
                ))}
              </ul>
            </div>
            <Divider />
            <div className="mb-3">
              <span className="fw-bold">Specialties</span>
              <ul className="list-group mt-2">
                {mentorCategoryData.specialties.map((specialty) => (
                  <li key={specialty._id} className="list-group-item border-0 ps-0">
                    <i className="text-info me-2">•</i> {specialty.specialtyId.name}
                  </li>
                ))}
              </ul>
            </div>
            <Divider />
          </>
        )}
        <div className="text-end">
          <Button
            type="primary"
            icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
            className="rounded-pill"
            style={{ backgroundColor: isEditing ? "#52c41a" : "#1890ff" }}
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={250} theme="light">
        <div className="p-4 text-center">
          <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: "#87d068" }} />
          <Title level={4} className="mt-3">
            {userData ? userData.username : "Loading..."}
          </Title>
          <p className="text-muted">Welcome to your dashboard</p>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeTab]}
          onClick={({ key }) => {
            setActiveTab(key);
            setIsEditing(false);
          }}
          items={[
            { key: "Profile", icon: <UserOutlined />, label: "Profile" },
            { key: "Security", icon: <LockOutlined />, label: "Security" },
          ]}
        />
      </Sider>

      <Layout>
        <Content style={{ padding: "30px 50px" }}>
          <Title level={3} className="mb-4" style={{ color: "#595959" }}>
            {activeTab === "Profile" ? "Public Profile" : "Security Settings"}
          </Title>
          {activeTab === "Profile" && renderProfileContent()}
          {activeTab === "Security" && (
            <Card title="Change Password" bordered={false} style={{ maxWidth: 500, margin: "0 auto" }}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <Input.Password placeholder="Enter current password" className="rounded" />
              </div>
              <Divider />
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <Input.Password placeholder="Enter new password" className="rounded" />
              </div>
              <Divider />
              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <Input.Password placeholder="Confirm new password" className="rounded" />
              </div>
              <Button type="primary" className="w-100 mt-3 rounded-pill">
                Change Password
              </Button>
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
