import React, { useEffect, useState, useMemo } from "react";
import {
  Row,
  Col,
  Layout,
  Spin,
  Card,
  Typography,
  message,
  Tooltip,
  Modal,
  DatePicker,
  Button,
  Form,
} from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import "../../style/Activity/myActivity.css";
import { CiWarning } from "react-icons/ci";
import OutcomeSteps from "./OutcomeSteps";
import { GrGroup } from "react-icons/gr";
import { BellOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Text } = Typography;

const MyActivity = () => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [classList, setClassList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [unassignedClasses, setUnassignedClasses] = useState([]);
  const [assignedClassesCount, setAssignedClassesCount] = useState(0);

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  useEffect(() => {
    const fetchClassesAndOutcomes = async () => {
      try {
        const [classResponse, outcomeResponse] = await Promise.all([
          axios.get(`${BASE_URL}/class/${userId}/user`, config),
          axios.get(
            `${BASE_URL}/activity/user/${userId}?activityType=outcome`,
            config
          ),
        ]);

        const allClasses = classResponse.data;
        const assignedClassIds = outcomeResponse.data.activities.map(
          (activity) => activity.classId._id
        );

        const assigned = allClasses.filter((classItem) =>
          assignedClassIds.includes(classItem._id)
        );
        const unassigned = allClasses.filter(
          (classItem) => !assignedClassIds.includes(classItem._id)
        );

        setClassList(allClasses);
        setAssignedClasses(assigned);
        setUnassignedClasses(unassigned);
        setAssignedClassesCount(assigned.length);
      } catch (error) {
        console.error("Error fetching classes or outcomes:", error);
        message.error("Có lỗi xảy ra khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchClassesAndOutcomes();
  }, [userId, config]);

  const toggleDetails = () => {
    setIsDetailsModalVisible(!isDetailsModalVisible);
  };

  const handleAssignOutcomeToClass = (cls) => {
    setSelectedClass(cls);
    setIsAssignModalVisible(true);
  };

  const submitAssignOutcome = async (values) => {
    setAssignLoading(true);
    const { startDate, deadline } = values;

    try {
      await axios.post(
        `${BASE_URL}/activity`,
        {
          assignmentType: "outcome 1",
          startDate: startDate.toISOString(),
          deadline: deadline.toISOString(),
          activityType: "outcome",
          classId: selectedClass._id,
        },
        config
      );

      message.success(
        `Giao Outcome 1 cho lớp "${selectedClass.className}" thành công!`
      );

      setAssignedClasses((prev) => [...prev, selectedClass]);
      setUnassignedClasses((prev) =>
        prev.filter((cls) => cls._id !== selectedClass._id)
      );
      setAssignedClassesCount((prev) => prev + 1);

      setIsAssignModalVisible(false);
      setSelectedClass(null);
    } catch (error) {
      console.error("Error assigning outcome:", error);
      message.error("Giao Outcome 1 thất bại!");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <Layout style={{ padding: "24px", backgroundColor: "#fff" }}>
      <Content>
        <Typography.Title style={{ textAlign: "center" }} level={2}>
          Dashboard Giáo Viên
        </Typography.Title>
        <div style={{ marginBottom: "24px" }}>
          <OutcomeSteps
            userId={userId}
            jwt={jwt}
            assignedClassesCount={assignedClassesCount}
            unassignedClasses={unassignedClasses}
            setAssignedClassesCount={setAssignedClassesCount}
            setAssignedClasses={setAssignedClasses}
            setUnassignedClasses={setUnassignedClasses}
            classList={classList}
          />
        </div>

        {loading ? (
          <Spin tip="Đang tải dữ liệu..." size="large" />
        ) : (
          <Row className="Card-problem">
            <Col span={15}>
              <Row
                style={{
                  backgroundColor: "#ff5252",
                  width: "fit-content",
                  padding: "3px 10px",
                  borderTopRightRadius: "5px",
                  borderTopLeftRadius: "5px",
                }}
              >
                <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>
                  Tổng vấn đề bạn cần giải quyết là:&nbsp;
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>
                  2 vấn đề
                </span>
              </Row>
              <Row style={{ margin: "0.3rem auto 1rem auto" }}>
                <span style={{ fontSize: "1rem", fontWeight: "500" }}>
                  Loại vấn đề:&nbsp;
                </span>
                <span
                  style={{ fontSize: "1rem", fontWeight: "500", color: "red" }}
                >
                  ưu tiên
                </span>
                <span style={{ fontSize: "1rem" }}>, &nbsp;</span>
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: "500",
                    color: "#FFBA57",
                  }}
                >
                  nhắc nhở
                </span>
              </Row>

              <Row gutter={[16, 8]}>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                  <Row
                    className="class-management-card priorityhigh"
                    gutter={[16, 16]}
                  >
                    <Col xs={24} style={{ padding: "0px" }}>
                      <Row className="content">
                        <Col xs={24} md={16} sm={16}>
                          <Row
                            className="data-value"
                            style={{ marginBottom: "10px" }}
                          >
                            {unassignedClasses.length}
                          </Row>
                          <Row className="title">
                            <p>Lớp chưa được giao bài tập</p>
                          </Row>
                        </Col>
                        <Col xs={24} md={8} sm={8} className="icon-position">
                          <CiWarning
                            style={{ color: "#FF5252", fontWeight: "600" }}
                          />
                        </Col>
                      </Row>
                      <Row className="footer red-card" onClick={toggleDetails}>
                        <p style={{ cursor: "pointer" }}>
                          Bấm vào để xem chi tiết
                        </p>
                      </Row>
                    </Col>
                  </Row>
                </Col>

                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                  <Row className="class-management-card" gutter={[16, 16]}>
                    <Col xs={24} style={{ padding: "0px" }}>
                      <Row className="content">
                        <Col xs={24} md={16} sm={16}>
                          <Row className="data-value">
                            <p style={{ color: "#FFBA57" }}>5</p>
                          </Row>
                          <Row className="title">
                            <p>Nhóm chưa nộp bài</p>
                          </Row>
                        </Col>
                        <Col xs={24} md={8} sm={8} className="icon-position">
                          <GrGroup />
                        </Col>
                      </Row>
                      <Row className="footer yellow-card">
                        <p>Bấm vào để xem chi tiết</p>
                      </Row>
                    </Col>
                  </Row>
                </Col>
              </Row>

              <Modal
                title="Danh sách các lớp chưa được giao Outcome"
                visible={isDetailsModalVisible}
                onCancel={toggleDetails}
                footer={null}
                width={600}
              >
                {unassignedClasses.length > 0 ? (
                  <ul style={{ listStyleType: "none", padding: 0 }}>
                    {unassignedClasses.map((cls) => (
                      <li
                        key={cls._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        <Text>{cls.className}</Text>
                        <Tooltip title="Giao Outcome 1 cho lớp này">
                          <BellOutlined
                            style={{
                              color: "#1890ff",
                              cursor: "pointer",
                              fontSize: "18px",
                            }}
                            onClick={() => handleAssignOutcomeToClass(cls)}
                          />
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Text type="success">
                    Tất cả các lớp đã được giao Outcome.
                  </Text>
                )}
              </Modal>

              <Modal
                title={`Giao Outcome 1 cho lớp: ${
                  selectedClass ? selectedClass.className : ""
                }`}
                visible={isAssignModalVisible}
                onCancel={() => {
                  setIsAssignModalVisible(false);
                  setSelectedClass(null);
                }}
                footer={null}
              >
                <Form layout="vertical" onFinish={submitAssignOutcome}>
                  <Form.Item
                    name="startDate"
                    label="Ngày bắt đầu"
                    rules={[
                      { required: true, message: "Vui lòng chọn ngày bắt đầu" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const deadline = getFieldValue("deadline");
                          if (!value) {
                            return Promise.resolve();
                          }
                          if (!deadline || value.isBefore(deadline)) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Ngày bắt đầu không thể sau hạn nộp")
                          );
                        },
                      }),
                    ]}
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item
                    name="deadline"
                    label="Hạn nộp"
                    rules={[
                      { required: true, message: "Vui lòng chọn hạn nộp" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const startDate = getFieldValue("startDate");
                          if (!value) {
                            return Promise.resolve();
                          }
                          if (!startDate || value.isAfter(startDate)) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Hạn nộp phải sau ngày bắt đầu")
                          );
                        },
                      }),
                    ]}
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={assignLoading}
                      block
                    >
                      Giao Outcome 1
                    </Button>
                  </Form.Item>
                </Form>
              </Modal>
            </Col>
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default MyActivity;
