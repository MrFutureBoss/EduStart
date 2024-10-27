import React, { useState } from "react";
import {
  Card,
  Button,
  Descriptions,
  Badge,
  Typography,
  Modal,
  List,
} from "antd";
import {
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux"; // Sử dụng useSelector để lấy dữ liệu từ Redux
import { Link } from "react-router-dom";

const { Title } = Typography;

const SemesterDetailsCard = ({ handleEditSemester }) => {
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
    <div style={{ marginBottom: 20 }}>
      <Card
        style={{
          marginBottom: 20,
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#f9f9f9",
          margin: "auto",
        }}
      >
        {status === "Ongoing" && (
          <Button
            type="link"
            icon={<EditOutlined />}
            style={{
              position: "absolute",
              top: "13px",
              right: "23px",
              backgroundColor: "#4682B4",
              color: "#FFF",
              borderRadius: "50%",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleEditSemester();
            }}
          ></Button>
        )}

        <Descriptions
          bordered
          style={{ marginTop: -10 }}
          size="small"
          title={
            <Title style={{ marginBottom: 2 }} level={3}>
              Thông tin chi tiết kỳ học
            </Title>
          }
          layout="horizontal"
          column={4}
        >
          <Descriptions.Item label={<strong>Tên kỳ học</strong>} span={1}>
            <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
              {semesterName}
            </Title>
          </Descriptions.Item>

          <Descriptions.Item label={<strong>Trạng thái</strong>}>
            {status === "Ongoing" && (
              <Badge
                status="processing"
                text={
                  <span style={{ fontWeight: 500, color: "#1890ff" }}>
                    Đang diễn ra
                  </span>
                }
              />
            )}
            {status === "Finished" && (
              <Badge
                status="default"
                text={
                  <span style={{ fontWeight: 500, color: "#8c8c8c" }}>
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
                  <span style={{ fontWeight: 500, color: "#faad14" }}>
                    Sắp diễn ra
                  </span>
                }
                icon={<ClockCircleOutlined />}
              />
            )}
          </Descriptions.Item>

          <Descriptions.Item label={<strong>Ngày bắt đầu</strong>}>
            {new Date(startDate).toLocaleDateString("vi-VN")}
          </Descriptions.Item>

          <Descriptions.Item label={<strong>Ngày kết thúc</strong>}>
            {new Date(endDate).toLocaleDateString("vi-VN")}
          </Descriptions.Item>

          <Descriptions.Item label={<strong>Số học sinh</strong>}>
            {studentCount}
          </Descriptions.Item>
          <Descriptions.Item label={<strong>Số giáo viên</strong>}>
            {teacherCount}
          </Descriptions.Item>
          <Descriptions.Item label={<strong>Số lớp học</strong>}>
            {classCount}
          </Descriptions.Item>
          <Descriptions.Item label={<strong>Số người hướng dẫn </strong>}>
            {mentorCount}
          </Descriptions.Item>
          {currentSemester?._id === sid && (
            <>
              <Descriptions.Item label={<strong>Học sinh đã có lớp</strong>}>
                {studentsWithClass}
              </Descriptions.Item>

              <Descriptions.Item label={<strong>Giáo viên có lớp</strong>}>
                <Button
                  type="link"
                  style={{ padding: 0 }}
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

              <Descriptions.Item label={<strong>Lớp có học sinh</strong>}>
                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() =>
                    handleShowModal(
                      "Danh sách các lớp có học sinh",
                      classesWithStudentsList
                    )
                  }
                >
                  {classesWithStudentsCount}
                </Button>
              </Descriptions.Item>

              <Descriptions.Item label={<strong>Mentor đã matched</strong>}>
                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() =>
                    handleShowModal(
                      "Danh sách mentor đã matched",
                      mentorsWithMatch
                    )
                  }
                >
                  {mentorsWithMatch.length}
                </Button>
              </Descriptions.Item>

              <Descriptions.Item label={<strong>Học sinh chưa có lớp</strong>}>
                <Link style={{ textDecoration: "none" }} to="pending-users">
                  {studentsWithoutClass}
                </Link>
              </Descriptions.Item>

              <Descriptions.Item label={<strong>Giáo viên chưa có lớp</strong>}>
                <Button
                  type="link"
                  style={{ padding: 0 }}
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

              <Descriptions.Item label={<strong>Lớp chưa có học sinh</strong>}>
                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() =>
                    handleShowModal(
                      "Danh sách các lớp chưa có học sinh",
                      classesWithoutStudentsList
                    )
                  }
                >
                  {classesWithoutStudentsCount}
                </Button>
              </Descriptions.Item>

              <Descriptions.Item label={<strong>Mentor chưa matched</strong>}>
                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() =>
                    handleShowModal(
                      "Danh sách mentor chưa matched",
                      mentorsWithoutMatch
                    )
                  }
                >
                  {mentorsWithoutMatch.length}
                </Button>
              </Descriptions.Item>
            </>
          )}
        </Descriptions>

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
                  title={<span>{item.username || item.className}</span>}
                  description={
                    item.studentCount
                      ? `Số lượng học sinh: ${item.studentCount}`
                      : item.email
                  }
                />
              </List.Item>
            )}
          />
        </Modal>
      </Card>
    </div>
  );
};

export default SemesterDetailsCard;
