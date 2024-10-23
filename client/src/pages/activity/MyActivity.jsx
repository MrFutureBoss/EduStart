import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Tooltip, Layout, App } from "antd"; // Import thêm Tooltip và Button
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import TeacherSidebar from "./TeacherSidebar";
import "../../style/Activity/myActivity.css";
import {
  BellFilled,
  BellOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import AppHeader from "../../layouts/admin/AdminHeader";

const MyActivity = () => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [classes, setClasses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const lateGroups = [
    "Nhóm A, outcome 1",
    "Nhóm B, outcome 2",
    "Nhóm C, outcome 3",
  ];

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

  const handleGroupClick = (groupName) => {
    alert(`Nhấn vào nhóm ${groupName} để xem chi tiết`); // Xử lý sự kiện khi nhấn vào nhóm
  };
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  return (
        <div style={{ padding: "24px", width: "100%" }}>
          <h1>Tất cả các lớp</h1>

          {loading ? (
            <p>Loading...</p>
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
                              style={{
                                color: "yellow",
                                fontSize: "24px",
                              }}
                            />
                          </span>
                        </Tooltip>
                      }
                    >
                      <div>
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
                      </div>
                    </Card>
                  </Col>
                ))
              ) : (
                <p>Không có lớp học nào</p>
              )}
            </Row>
          )}
        </div>
  );
};

export default MyActivity;
