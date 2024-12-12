import React, { useEffect, useMemo, useState } from "react";
import Result2 from "./DnD_JoinGroup/Result";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../../utilities/initalValue";
import axios from "axios";
import {
  setAllGroupInClass,
  setTeacherInfoInClass,
} from "../../redux/slice/GroupSlice";
import { setUserProfile } from "../../redux/slice/UserSlice";
import { Avatar, Card, Col, Row, Spin, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";

const { Link, Text, Title } = Typography;

const ClassDetail = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [classId, setClassId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const handleMGroupDetail = (groupId) => {
    navigate(`/teacher/group-detail/${groupId}`);
  };

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
        const response = await axios.get(`${BASE_URL}/user/${userId}`, config);
        dispatch(setUserProfile(response.data));
        setClassId(response.data?.classId);
      } catch (error) {
        console.error(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [dispatch, config, userId]);

  //Danh sách nhóm chính thức
  useEffect(() => {
    if (!classId) return;
    const fetchGroupData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/group/class/${classId}`, {
          ...config,
        });
        dispatch(setAllGroupInClass(response.data?.groups));
        dispatch(setTeacherInfoInClass(response.data?.teacher));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [classId, config, dispatch]);

  const groupInClass = useSelector((state) => state.group.groupInClass || []);
  const teacherInClass = useSelector((state) => state.group.teacherInfor || []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div>
      {groupInClass.length > 0 ? (
        <Row gutter={[8, 8]}>
          <Col span={24} style={{ textAlign: "center", marginBottom: "16px" }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              Danh sách nhóm của lớp {groupInClass[0].classId?.className}
            </h1>
          </Col>
          <Col sm={24} lg={18}>
            <Row gutter={[8, 8]}>
              {groupInClass.map((group) => (
                <Col key={group._id} xs={24} sm={24} md={12} lg={8} xl={8}>
                  <Card
                    title={
                      <span
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: group.status === "InActive" ? "#FFF" : "#FFF",
                        }}
                      >
                        {group.name}{" "}
                        {group.status === "InActive" ? "- Đã giải tán" : ""}
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
                      backgroundColor:
                        group.status === "InActive" ? "grey" : "#60B2C7",
                      textAlign: "center",
                    }}
                    className="manage-group-card"
                  >
                    <div style={{ padding: "0", textAlign: "left" }}>
                      <Text style={{ fontSize: "14px", color: "#555" }}>
                        <b>Tên đề tài:</b>{" "}
                        <span style={{ color: "#1890FF", fontWeight: "600" }}>
                          {" "}
                          {group.projectId ? (
                            group.projectId.name
                          ) : (
                            <Text
                              type="secondary"
                              style={{ fontStyle: "italic" }}
                            >
                              Chưa chốt
                            </Text>
                          )}
                        </span>
                      </Text>
                    </div>
                    <div style={{ padding: "0", textAlign: "left" }}>
                      <Text style={{ fontSize: "14px", color: "#555" }}>
                        <b>Nhóm trưởng:</b>{" "}
                        {group.mentor !== null ? (
                          <span style={{ color: "#1890FF", fontWeight: "600" }}>
                            {group.mentor?.username}
                          </span>
                        ) : (
                          <span>Chưa có</span>
                        )}
                      </Text>
                    </div>
                    <div style={{ padding: "0", textAlign: "left" }}>
                      <Text style={{ fontSize: "14px", color: "#555" }}>
                        <b>Thành viên:</b> {group?.users.length}{" "}
                        <UserOutlined />
                      </Text>
                    </div>
                    <div style={{ textAlign: "center", marginTop: "12px" }}>
                      <Link
                        onClick={() => handleMGroupDetail(group._id)}
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
          <Col sm={24} lg={6}>
            <Card
              title={`Thông tin giáo viên`}
              className="group-members-mentor-card"
            >
              <Avatar
                src={teacherInClass.image}
                size={80}
                style={{
                  marginBottom: "8px",
                  backgroundColor: "rgb(98, 182, 203)",
                  fontSize: 30,
                }}
              >
                {teacherInClass.username
                  ? teacherInClass.username
                      .split(" ")
                      .pop()
                      .charAt(0)
                      .toUpperCase()
                  : "?"}
              </Avatar>
              <Title level={5}>{teacherInClass.username}</Title>
              <p>
                <Text type="secondary">{teacherInClass.email}</Text>
              </p>
              <p>{teacherInClass.phoneNumber}</p>
              {/* <p>
                <Text type="secondary">
                  {groupDetails?.mentorCategoryDetails
                    .map((c) => c.name)
                    .join(", ")}
                </Text>
              </p> */}
            </Card>
          </Col>
        </Row>
      ) : (
        <Result2 />
      )}
    </div>
  );
};

export default ClassDetail;
