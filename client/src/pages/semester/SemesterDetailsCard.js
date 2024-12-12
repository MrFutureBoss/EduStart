import React, { useState } from "react";
import {
  Card,
  Button,
  Descriptions,
  Badge,
  Typography,
  Modal,
  List,
  Row,
  Col,
} from "antd";
import {
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UserOutlined,
  SolutionOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux"; // Sử dụng useSelector để lấy dữ liệu từ Redux
import { Link, useLocation } from "react-router-dom";

const { Title } = Typography;

const SemesterDetailsCard = () => {
  const location = useLocation();
  const isManagerUser = location.pathname.includes("admin/current-semester");
  const isAdminDashboard = location.pathname.includes("admin/dashboard");
  // Lấy dữ liệu từ Redux
  const {
    currentSemester,
    semesterName,
    startDate,
    endDate,
    studentCount,
    teacherCount,
    mentorCount,
    classCount,
    studentsWithClass, // Đã có lớp
    studentsWithoutClass, // Chưa có lớp
    teachersWithClassCount,
    teachersWithoutClassCount,
    classesWithStudentsCount,
    classesWithoutStudentsCount,
    classesWithStudentsList,
    classesWithoutStudentsList,
    teachersWithClasses,
    teachersWithoutClasses,
    mentorsWithMatch,
    mentorsWithoutMatch,
    status,
    sid,
  } = useSelector((state) => state.semester); // Truy cập vào Redux store
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);

  const handleShowModal = (title, data) => {
    setModalTitle(title);
    setModalData(data);
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
  };

  return (
    <div style={{ marginBottom: 10 }}>
      {isAdminDashboard && (
        <Card
          style={{
            borderRadius: "8px",
            backgroundColor: "#f5f5f5",
            marginTop: 8,
          }}
        >
          {/* {status === "Ongoing" && (
          <Button
            type="link"
            icon={<EditOutlined />}
            style={{
              position: "absolute",
              zIndex: 50,
              top: "10px",
              right: "8px",
              backgroundColor: "#4682B4",
              color: "#FFF",
              borderRadius: "50%",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleEditSemester();
            }}
          ></Button>
        )} */}

          {/* Nhóm 1: Thông tin chung */}
          <Card
            bordered={false}
            className="semester-infor-head"
            style={{ marginBottom: 10 }}
            title={
              <Title style={{ marginBottom: 2, fontSize: 16 }} level={5}>
                Thông tin chung
              </Title>
            }
          >
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item
                style={{ padding: "4px 8px" }}
                label={<strong style={{ fontSize: 13 }}>Kỳ học</strong>}
              >
                <Title
                  level={5}
                  style={{ margin: 0, color: "#1890ff", fontSize: 16 }}
                >
                  {semesterName}
                </Title>
              </Descriptions.Item>
              <Descriptions.Item
                style={{ padding: "4px 8px" }}
                label={<strong style={{ fontSize: 13 }}>Trạng thái</strong>}
              >
                {status === "Ongoing" && (
                  <Badge
                    status="processing"
                    text={
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#1890ff",
                          fontSize: 13,
                        }}
                      >
                        Đang diễn ra
                      </span>
                    }
                  />
                )}
                {status === "Finished" && (
                  <Badge
                    status="default"
                    text={
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#8c8c8c",
                          fontSize: 13,
                        }}
                      >
                        Đã kết thúc
                      </span>
                    }
                    icon={<CheckCircleOutlined />}
                  />
                )}
                {status === "Upcoming" && (
                  <Badge
                    status="warning"
                    text={
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#faad13",
                          fontSize: 13,
                        }}
                      >
                        Sắp diễn ra
                      </span>
                    }
                    icon={<ClockCircleOutlined />}
                  />
                )}
              </Descriptions.Item>
              <Descriptions.Item
                style={{ padding: "4px 8px" }}
                label={<strong style={{ fontSize: 13 }}>Ngày bắt đầu</strong>}
              >
                <span style={{ fontSize: 13 }}>
                  {startDate
                    ? new Date(startDate).toLocaleDateString("vi-VN")
                    : ""}{" "}
                </span>
              </Descriptions.Item>
              <Descriptions.Item
                style={{ padding: "4px 8px" }}
                label={<strong style={{ fontSize: 13 }}>Ngày kết thúc</strong>}
              >
                <span style={{ fontSize: 13 }}>
                  {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : ""}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Nhóm 2: Thông tin số lượng */}

          <Card
            bordered={false}
            style={{ marginBottom: 10 }}
            className="semester-infor-head"
            title={
              <Title style={{ marginBottom: 2, fontSize: 16 }} level={5}>
                Thông tin số lượng
              </Title>
            }
          >
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item
                style={{ padding: "4px 8px" }}
                label={<strong style={{ fontSize: 13 }}>Số sinh viên</strong>}
              >
                <span style={{ fontSize: 13 }}>{studentCount}</span>
              </Descriptions.Item>
              <Descriptions.Item
                style={{ padding: "4px 8px" }}
                label={<strong style={{ fontSize: 13 }}>Số giáo viên</strong>}
              >
                <span style={{ fontSize: 13 }}>{teacherCount}</span>
              </Descriptions.Item>
              <Descriptions.Item
                style={{ padding: "4px 8px" }}
                label={<strong style={{ fontSize: 13 }}>Số lớp học</strong>}
              >
                <span style={{ fontSize: 13 }}>{classCount}</span>
              </Descriptions.Item>
              <Descriptions.Item
                style={{ padding: "4px 8px" }}
                label={
                  <strong style={{ fontSize: 13 }}>Số người hướng dẫn</strong>
                }
              >
                <span style={{ fontSize: 13 }}>{mentorCount}</span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Nhóm 3: Thông tin chi tiết */}
          {currentSemester?._id === sid && (
            <Card
              bordered={false}
              className="semester-infor-head"
              style={{ marginBottom: 10 }}
              title={
                <Title style={{ marginBottom: 2, fontSize: 16 }} level={5}>
                  Thông tin chi tiết
                </Title>
              }
            >
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item
                  style={{ padding: "4px 8px" }}
                  label={
                    <strong style={{ fontSize: 13 }}>
                      Sinh viên đã có lớp
                    </strong>
                  }
                >
                  <span style={{ fontSize: 13 }}>{studentsWithClass}</span>
                </Descriptions.Item>
                <Descriptions.Item
                  style={{ padding: "4px 8px" }}
                  label={
                    <strong style={{ fontSize: 13 }}>
                      Sinh viên chưa có lớp
                    </strong>
                  }
                >
                  <Link
                    style={{ textDecoration: "none", fontSize: 13 }}
                    to="/admin/class-manager"
                  >
                    {studentsWithoutClass}
                  </Link>
                </Descriptions.Item>
                <Descriptions.Item
                  style={{ padding: "4px 8px" }}
                  label={
                    <strong style={{ fontSize: 13 }}>Giáo viên có lớp</strong>
                  }
                >
                  <Button
                    type="link"
                    style={{ padding: 0, fontSize: 13 }}
                    onClick={() =>
                      handleShowModal(
                        "Danh sách giáo viên có lớp",
                        teachersWithClasses
                      )
                    }
                  >
                    {teachersWithClassCount}
                  </Button>
                </Descriptions.Item>
                <Descriptions.Item
                  style={{ padding: "4px 8px" }}
                  label={
                    <strong style={{ fontSize: 13 }}>
                      Giáo viên chưa có lớp
                    </strong>
                  }
                >
                  <Button
                    type="link"
                    style={{ padding: 0, fontSize: 13 }}
                    onClick={() =>
                      handleShowModal(
                        "Danh sách giáo viên chưa có lớp",
                        teachersWithoutClasses
                      )
                    }
                  >
                    {teachersWithoutClassCount}
                  </Button>
                </Descriptions.Item>
                <Descriptions.Item
                  style={{ padding: "4px 8px" }}
                  label={
                    <strong style={{ fontSize: 13 }}>Lớp có sinh viên</strong>
                  }
                >
                  <Button
                    type="link"
                    style={{ padding: 0, fontSize: 13 }}
                    onClick={() =>
                      handleShowModal(
                        "Danh sách các lớp có sinh viên",
                        classesWithStudentsList
                      )
                    }
                  >
                    {classesWithStudentsCount}
                  </Button>
                </Descriptions.Item>
                <Descriptions.Item
                  style={{ padding: "4px 8px" }}
                  label={
                    <strong style={{ fontSize: 13 }}>
                      Lớp chưa có sinh viên
                    </strong>
                  }
                >
                  <Button
                    type="link"
                    style={{ padding: 0, fontSize: 13 }}
                    onClick={() =>
                      handleShowModal(
                        "Danh sách các lớp chưa có sinh viên",
                        classesWithoutStudentsList
                      )
                    }
                  >
                    {classesWithoutStudentsCount}
                  </Button>
                </Descriptions.Item>
                <Descriptions.Item
                  style={{ padding: "4px 8px" }}
                  label={
                    <strong style={{ fontSize: 13 }}>
                      Người hướng dẫn đã có nhóm
                    </strong>
                  }
                >
                  <Button
                    type="link"
                    style={{ padding: 0, fontSize: 13 }}
                    onClick={() =>
                      handleShowModal(
                        "Danh sách người hướng dẫn đã matched",
                        mentorsWithMatch
                      )
                    }
                  >
                    {mentorsWithMatch.length}
                  </Button>
                </Descriptions.Item>
                <Descriptions.Item
                  style={{ padding: "4px 8px" }}
                  label={
                    <strong style={{ fontSize: 13 }}>
                      Người hướng dẫn chưa có nhóm
                    </strong>
                  }
                >
                  <Button
                    type="link"
                    style={{ padding: 0, fontSize: 13 }}
                    onClick={() =>
                      handleShowModal(
                        "Danh sách người hướng dẫn chưa matched",
                        mentorsWithoutMatch
                      )
                    }
                  >
                    {mentorsWithoutMatch.length}
                  </Button>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Modal hiển thị danh sách chi tiết */}
          <Modal
            title={modalTitle}
            visible={isModalVisible}
            onCancel={handleCancelModal}
            footer={null}
          >
            <List
              dataSource={modalData}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <span style={{ fontSize: 13 }}>
                        {item.username || item.className}
                      </span>
                    }
                    description={
                      item.studentCount
                        ? `Số lượng sinh viên: ${item.studentCount}`
                        : item.email
                    }
                  />
                </List.Item>
              )}
            />
          </Modal>
        </Card>
      )}
      {isManagerUser && (
        <Row
          gutter={[16, 16]}
          style={{ marginBottom: "16px", backgroundColor: "rgb(238 238 238)" }}
        >
          <Col
            style={{
              backgroundColor: "rgb(238 238 238)",
              padding: 9,
              marginTop: 4,
            }}
            span={24}
          >
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card
                  bodyStyle={{ padding: "8px" }}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      Số sinh viên
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        marginLeft: 5,
                      }}
                    >
                      {studentCount}
                    </span>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card
                  bodyStyle={{ padding: "8px" }}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      Số giáo viên
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        marginLeft: 5,
                      }}
                    >
                      {teacherCount}
                    </span>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card
                  bodyStyle={{ padding: "8px" }}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      Số người hướng dẫn:
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        marginLeft: 5,
                      }}
                    >
                      {mentorCount}
                    </span>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card
                  bodyStyle={{ padding: "8px" }}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      Số lớp học:
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        marginLeft: 5,
                      }}
                    >
                      {classCount}
                    </span>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default SemesterDetailsCard;
