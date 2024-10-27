import React, { useEffect, useState } from "react";
import { Row, Col, Tooltip, Layout, Spin } from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import "../../style/Activity/myActivity.css";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import OutcomeSteps from "./OutcomeSteps";

const { Content } = Layout;

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

  const earlyGroups = [
    { className: "Lớp A", groupName: "Nhóm 1", daysLate: 0 },
    { className: "Lớp B", groupName: "Nhóm 2", daysLate: 0 },
  ];

  const lateGroups = [
    { className: "Lớp C", groupName: "Nhóm 3", daysLate: 2 },
    { className: "Lớp D", groupName: "Nhóm 4", daysLate: 4 },
    { className: "Lớp E", groupName: "Nhóm 5", daysLate: 6 },
    { className: "Lớp F", groupName: "Nhóm 6", daysLate: 8 },
  ];

  return (
        <Layout style={{ padding: "24px" }}>
          <Content>
            <div style={{ marginBottom: "24px" }}>
              <h1>Tiến trình Outcomes</h1>
              <OutcomeSteps classId={userId} />
            </div>

            <h2>Tiến trình nộp outcome 2</h2>
            {loading ? (
              <Spin tip="Đang tải dữ liệu..." size="large" />
            ) : (
              <div className="groups-container">
                <div className="group-column">
                  <h2 className="group-column-title">Nhóm nộp sớm</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {earlyGroups.map((group, index) => (
                      <Tooltip key={index} title="Nộp đúng hạn">
                        <div className="group-circle-container early-group">
                          <div className="group-circle-large gradientBg animated">
                            {group.className} - {group.groupName}
                          </div>
                          <div className="group-circle-small">
                          <CheckOutlined />
                          </div>
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>
                <div className="group-column">
                  <h2 className="group-column-title">Nhóm nộp muộn</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {lateGroups.map((group, index) => (
                      <Tooltip
                        key={index}
                        title={`Muộn ${group.daysLate} ngày`}
                      >
                        <div className="group-circle-container late-group">
                          <div className="group-circle-large red-gradientBg animated">
                            {group.className} - {group.groupName}
                          </div>
                          <div className="group-circle-small">
                            {group.daysLate}
                          </div>
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Content>
        </Layout>
  );
};

export default MyActivity;
