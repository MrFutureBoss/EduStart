import { UserOutlined } from "@ant-design/icons";
import { Card, Col, Row, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { setAllGroupInClass } from "../../redux/slice/GroupSlice";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { setSid } from "../../redux/slice/semesterSlide";

const { Link, Text } = Typography;

const GroupList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const { className } = useParams();
  const [classId, setClassId] = useState(null);
  const [actionGroup, setGroupAction] = useState(1);

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
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [className, config]);
  const { sid } = useSelector((state) => state.semester);
  const fetchCurrentSemester = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/semester/current`, config);
      const semesterData = response.data;
      dispatch(setSid(semesterData._id));
    } catch (error) {
      console.error("Error fetching current semester:", error);
    }
  };

  useEffect(() => {
    fetchCurrentSemester();
  }, [config]);
  //Danh sách nhóm chính thức
  useEffect(() => {
    if (!classId) return;
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/group/class/${classId}/${sid}`,
          {
            ...config,
          }
        );
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

  const handleMGroupDetail = (groupId) => {
    navigate(`/teacher/group-detail/${groupId}`);
  };

  const location = useLocation();
  const filterByUnfinished =
    new URLSearchParams(location.search).get("filter") === "unfinished";
  const filteredGroupInClass = filterByUnfinished
    ? groupInClass.filter((group) => !group.projectId || !group.projectId.name)
    : groupInClass;

  return (
    <Row gutter={[16, 16]}>
      <Col span={24} style={{ textAlign: "center", marginBottom: "16px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#333",
          }}
        >
          Danh sách nhóm
        </h1>
      </Col>
      {filteredGroupInClass.map((group) => (
        <Col key={group._id} xs={24} sm={24} md={12} lg={8}>
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
              backgroundColor: group.status === "InActive" ? "grey" : "#60B2C7",
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
                    <Text type="secondary" style={{ fontStyle: "italic" }}>
                      Chưa chốt
                    </Text>
                  )}
                </span>
              </Text>
            </div>
            <div style={{ padding: "0", textAlign: "left" }}>
              <Text style={{ fontSize: "14px", color: "#555" }}>
                <b>Người hướng dẫn:</b> Chưa có
              </Text>
            </div>
            <div style={{ padding: "0", textAlign: "left" }}>
              <Text style={{ fontSize: "14px", color: "#555" }}>
                <b>Thành viên:</b> 5 <UserOutlined />
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
  );
};

export default GroupList;
