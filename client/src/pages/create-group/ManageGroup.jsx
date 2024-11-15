import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL } from "../../utilities/initalValue";
import axios from "axios";
import { setAllGroupInClass } from "../../redux/slice/GroupSlice";
import { Col, Row, Card, Typography, Menu } from "antd";
import { FileOutlined, PlusOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";

const { Link, Text } = Typography;

const ManageGroup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const { className } = useParams();
  const [classId, setClassId] = useState(null);
  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/className/${className}`,
          config
        );
        setClassId(response.data?.classId);
        console.log("classId: " + response.data?.classId);
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [className, config]);

  //Danh sách nhóm chính thức
  useEffect(() => {
    if (!classId) return;
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/group/class/${classId}`, {
          ...config,
        });
        dispatch(setAllGroupInClass(response.data?.groups));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [classId, config, dispatch]);

  const groupInClass = useSelector((state) => state.group.groupInClass || []);

  return (
    <Row
      gutter={[24, 24]}
      style={{
        padding: "24px",
        backgroundColor: "#f7f9fc",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Col span={4} style={{ display: "flex", alignItems: "flex-start" }}>
        <Card
          bordered={false}
          title="Chức năng"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
          }}
          headStyle={{
            backgroundColor: "#e6f7ff",
            borderBottom: "1px solid #d9d9d9",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "18px",
          }}
          bodyStyle={{
            padding: "16px",
          }}
        >
          <Menu
            mode="vertical"
            style={{
              border: "none",
              backgroundColor: "transparent",
              padding: "0",
            }}
            items={[
              {
                key: "1",
                icon: (
                  <TeamOutlined
                    style={{ fontSize: "16px", color: "#1890ff" }}
                  />
                ),
                label: (
                  <span
                    onClick={() => console.log("Quản lý nhóm được kích hoạt!")}
                  >
                    Yêu cầu
                  </span>
                ),
              },
              {
                key: "2",
                icon: (
                  <FileOutlined
                    style={{ fontSize: "16px", color: "#1890ff" }}
                  />
                ),
                label: (
                  <span
                    onClick={() => console.log("Xem báo cáo được kích hoạt!")}
                  >
                    Xem báo cáo
                  </span>
                ),
              },
              {
                key: "3",
                icon: (
                  <PlusOutlined
                    style={{ fontSize: "16px", color: "#1890ff" }}
                  />
                ),
                label: (
                  <span
                    onClick={() => console.log("Tạo nhóm mới được kích hoạt!")}
                  >
                    Chuyển nhóm
                  </span>
                ),
              },
            ]}
          />
        </Card>
      </Col>

      <Col span={20}>
        <Row gutter={[16, 16]}>
          <Col span={24} style={{ textAlign: "center", marginBottom: "16px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>
              Danh sách nhóm
            </h1>
          </Col>
          {groupInClass.map((group) => (
            <Col key={group._id} xs={24} sm={12} md={8} lg={6}>
              <Card
                title={
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#1890ff",
                    }}
                  >
                    {group.name}
                  </span>
                }
                bordered={false}
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  backgroundColor: "#fff",
                }}
                headStyle={{
                  backgroundColor: "#e6f7ff",
                  textAlign: "center",
                }}
                className="manage-group-card"
              >
                <div style={{ padding: "0", textAlign: "left" }}>
                  <Text style={{ fontSize: "14px", color: "#555" }}>
                    <b>Tên đề tài:</b>{" "}
                    {group.projectId ? (
                      group.projectId
                    ) : (
                      <Text type="secondary" style={{ fontStyle: "italic" }}>
                        Chưa chốt
                      </Text>
                    )}
                  </Text>
                </div>
                <div style={{ padding: "0", textAlign: "left" }}>
                  <Text style={{ fontSize: "14px", color: "#555" }}>
                    <b>Người hướng:</b> Chưa có
                  </Text>
                </div>
                <div style={{ padding: "0", textAlign: "left" }}>
                  <Text style={{ fontSize: "14px", color: "#555" }}>
                    <b>Thành viên:</b> 5 <UserOutlined />
                  </Text>
                </div>
                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  <Link
                    onClick={() => navigate(`/group/${group._id}`)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#1890ff",
                      color: "#fff",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Xem chi tiết nhóm
                  </Link>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Col>
    </Row>
  );
};

export default ManageGroup;
