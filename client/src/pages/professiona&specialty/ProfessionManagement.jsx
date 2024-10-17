import React, { useEffect } from "react";
import { Card, Row, Col, Button, Tooltip } from "antd";
import { WarningOutlined, ClockCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import TeacherSidebar from "./TeacherSidebar";
import "../../style/Activity/myActivity.css"; // Import CSS

const MyActivity = () => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [classes, setClasses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const lateGroups = ["Nhóm A", "Nhóm B", "Nhóm C"]; // Cố định các nhóm nộp muộn

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

  return (
    <div style={{ display: "flex" }}>
      <TeacherSidebar />

      <div style={{ padding: "24px", width: "100%" }}>
        <h1>Màn hình chính</h1>

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
                  >
                    <div>
                      <p>Nhóm nộp muộn:</p>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {lateGroups.map((group) => (
                          <Tooltip key={group} title={`Xem chi tiết ${group}`}>
                            <Button
                              shape="square"
                              style={{
                                fontStyle: "italic",
                                color: "grey",
                                fontSize: "14px",
                                border: "1px solid grey",
                                borderRadius: "4px",
                                padding: "4px 12px",
                                cursor: "pointer",
                              }}
                              onClick={() => handleGroupClick(group)}
                              icon={
                                <ClockCircleOutlined
                                  style={{ color: "red", marginRight: "4px" }}
                                />
                              }
                            >
                              {group}
                            </Button>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                    <p>
                      Hoạt động:{" "}
                      {classItem.activityCount || "Chưa có hoạt động"}
                    </p>
                  </Card>
                </Col>
              ))
            ) : (
              <p>Không có lớp học nào</p>
            )}
          </Row>
        )}
      </div>
    </div>
  );
};

export default MyActivity;
