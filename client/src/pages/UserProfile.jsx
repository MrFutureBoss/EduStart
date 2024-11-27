import { useState, useEffect } from "react";
import { Input, Button, Layout, Card, Typography, Divider } from "antd";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const { Content } = Layout;
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
          .get(
            `http://localhost:9999/mentorcategory/findmentorcategorybyuserid/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
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
    const token = localStorage.getItem("jwt");

    console.log("Updated userData before saving:", userData);

    axios
      .put(
        "http://localhost:9999/user/profile/edit",
        { ...userData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        console.log("Profile updated:", response.data);
        setIsEditing(false);
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
      });
  };

  const renderProfileContent = () => {
    if (!userData) return <p>Loading...</p>;

    return (
      <Card
        title={<Title level={4} className="text-center">Thông Tin Cá Nhân</Title>}
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
          <span className="fw-bold">Họ Tên</span>
          <Input
            value={userData?.username}
            onChange={(e) => setUserData({ ...userData, username: e.target.value })}
            disabled={!isEditing}
            className="rounded"
            style={{ width: "75%" }}
          />
        </div>
        <Divider />
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="fw-bold">Email</span>
          <Input
            value={userData?.email}
            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            disabled={!isEditing}
            className="rounded"
            style={{ width: "75%" }}
          />
        </div>
        <Divider />
        {userRole === "2" && (
          <>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="fw-bold">Số Điện Thoại</span>
              <Input
                value={userData?.phoneNumber}
                onChange={(e) =>
                  setUserData({ ...userData, phoneNumber: e.target.value })
                }
                disabled={!isEditing}
                className="rounded"
                style={{ width: "75%" }}
              />
            </div>
            <Divider />
          </>
        )}
        {userRole === "4" && (
          <>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="fw-bold">Chuyên Ngành</span>
              <Input
                value={userData?.major}
                onChange={(e) => setUserData({ ...userData, major: e.target.value })}
                disabled={!isEditing}
                className="rounded"
                style={{ width: "75%" }}
              />
            </div>
            <Divider />
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="fw-bold">Mã Số Sinh Viên</span>
              <Input
                value={userData?.rollNumber}
                onChange={(e) =>
                  setUserData({ ...userData, rollNumber: e.target.value })
                }
                disabled={!isEditing}
                className="rounded"
                style={{ width: "75%" }}
              />
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
            {isEditing ? "Lưu Thông tin" : "Xửa Thông Tin"}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ padding: "30px 50px" }}>
          {activeTab === "Profile" && renderProfileContent()}
        </Content>
      </Layout>
    </Layout>
  );
}
