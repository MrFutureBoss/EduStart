import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Tooltip, Layout, Spin } from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import TeacherSidebar from "./TeacherSidebar";
import "../../style/Activity/myActivity.css";
import { BellOutlined, ClockCircleOutlined } from "@ant-design/icons";
import AppHeader from "../../layouts/admin/AdminHeader";
import OutcomeSteps from "./OutcomeSteps";

const { Header, Sider, Content } = Layout;

const MyActivity = () => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/${userId}/user`,
          config
        );
        setClasses(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setLoading(false);
      }
    };
    fetchClasses();
  }, [userId, jwt]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleGroupClick = (groupName) => {
    alert(`Nhấn vào nhóm ${groupName} để xem chi tiết`);
  };

  const lateGroups = [
    "Nhóm A, outcome 1",
    "Nhóm B, outcome 2",
    "Nhóm C, outcome 3",
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppHeader collapsed={collapsed} toggleCollapse={toggleCollapse} />
      <Layout>
        <TeacherSidebar collapsed={collapsed} toggleCollapse={toggleCollapse} />
        <Layout style={{ padding: "24px" }}>
          <Content>
            <div style={{ marginBottom: "24px" }}>
              <h1>Tiến trình Outcomes</h1>
              <OutcomeSteps classId={userId} />
            </div>

            <h1>Tất cả các lớp</h1>
            {loading ? (
              <Spin tip="Đang tải dữ liệu..." size="large" />
            ) : (
              <Row gutter={16}>
                {classes.length > 0 ? (
                  classes.map((classItem) => (
                    <Col key={classItem._id} xs={24} sm={12} md={8}>
                      <Card
                        bordered={false}
                        className="custom-card"
                        title={classItem.className}
                        extra={
                          <Tooltip title="Bấm vào đây để gửi lời nhắc cho các nhóm!">
                            <span style={{ cursor: "pointer" }}>
                              <BellOutlined
                                className="shake-on-hover"
                                style={{ color: "yellow", fontSize: "24px" }}
                              />
                            </span>
                          </Tooltip>
                        }
                      >
                        <p style={{ color: "red" }}>
                          <ClockCircleOutlined /> Nhóm nộp muộn:
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {lateGroups.map((group) => (
                            <Tooltip
                              key={group}
                              title={`Bấm vào đây để gửi lời nhắc cho ${group}`}
                            >
                              <Button
                                shape="square"
                                style={{
                                  fontStyle: "italic",
                                  color: "black",
                                  fontSize: "14px",
                                  border: "1px solid black",
                                  borderRadius: "4px",
                                  padding: "4px 12px",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleGroupClick(group)}
                              >
                                {group}
                              </Button>
                            </Tooltip>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <p>Không có lớp học nào</p>
                )}
              </Row>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MyActivity;
