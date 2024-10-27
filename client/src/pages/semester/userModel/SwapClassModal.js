import React, { useEffect, useState } from "react";
import {
  Modal,
  Select,
  Button,
  message,
  Descriptions,
  Typography,
  Card,
} from "antd";
import { SwapOutlined } from "@ant-design/icons"; // Import biểu tượng
import { useSelector, useDispatch } from "react-redux"; // Thêm useDispatch
import axios from "axios";
import "./SwapClassModal.css"; // Import CSS file
import { BASE_URL } from "../../../utilities/initalValue";
import { setRecentlyUpdatedUsers } from "../../../redux/slice/UserSlice";

const { Option } = Select;
const { Title } = Typography;

const SwapClassModal = ({ visible, onCancel, student, refreshData }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const jwt = localStorage.getItem("jwt");
  const { usersInSmt } = useSelector((state) => state.semester);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!visible) {
      setSelectedStudent(null);
      setIsAnimating(false);
    }
  }, [visible]);

  const handleSwap = async () => {
    if (!selectedStudent) {
      message.error("Vui lòng chọn học sinh để hoán đổi.");
      return;
    }

    try {
      setIsAnimating(true);
      const { data } = await axios.post(
        `${BASE_URL}/admins/swap`,
        { studentId1: student._id, studentId2: selectedStudent },
        {
          headers: {
            authorization: `Bearer ${jwt}`,
          },
        }
      );

      // Cập nhật danh sách recentlyUpdatedUsers
      dispatch(setRecentlyUpdatedUsers([student._id, selectedStudent]));

      message.success("Hoán đổi lớp thành công!");
      setTimeout(() => {
        setIsAnimating(false);
        onCancel();
        refreshData();
      }, 1000);
    } catch (error) {
      setIsAnimating(false);
      message.error("Lỗi khi hoán đổi lớp. Vui lòng thử lại sau.");
    }
  };

  // Kiểm tra nếu student là null, không render modal
  if (!student) {
    return null;
  }

  // Tìm lớp mới sau khi hoán đổi của cả hai học sinh
  const currentStudentClass = student.classId?.className || "Chưa có lớp";
  const currentStudentClassId = student.classId?._id; // Lấy ID lớp hiện tại
  const selectedStudentClass = selectedStudent
    ? usersInSmt.find((user) => user._id === selectedStudent)?.classId
        ?.className || "Chưa có lớp"
    : null;

  return (
    <Modal
      title={`Hoán đổi lớp cho học sinh: ${student?.username}`}
      visible={visible}
      onCancel={onCancel}
      width={1100} // Tăng width để giao diện rộng hơn
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={isAnimating}>
          Hủy bỏ
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSwap}
          disabled={!selectedStudent || isAnimating}
        >
          Hoán đổi lớp
        </Button>,
      ]}
      destroyOnClose={true} // Đảm bảo modal được reset khi đóng
    >
      <div className={`swap-container`}>
        {/* Bên trái: Thông tin học sinh hiện tại */}
        <div className={`student-info ${isAnimating ? "slide-right" : ""}`}>
          <Title style={{ marginBottom: 20, marginTop: 34 }} level={5}>
            Học sinh hiện tại
          </Title>
          <Card bordered={true} className="student-card">
            <Descriptions column={1} bordered={false}>
              <Descriptions.Item label={<b>Tên</b>}>
                {student?.username}
              </Descriptions.Item>
              <Descriptions.Item label={<b>Email</b>}>
                {student?.email}
              </Descriptions.Item>
              <Descriptions.Item label={<b>MSSV</b>}>
                {student?.rollNumber}
              </Descriptions.Item>
              <Descriptions.Item label={<b>Lớp hiện tại</b>}>
                <span style={{ color: "green", fontWeight: "bold" }}>
                  {currentStudentClass}
                </span>
              </Descriptions.Item>
              {selectedStudent && (
                <Descriptions.Item label={<b>Lớp mới</b>} className="new-class">
                  <span style={{ color: "#4682B4" }}>
                    {selectedStudentClass}
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </div>

        {/* Biểu tượng Hoán đổi với hiệu ứng quay và đổi màu */}
        <div className="swap-icon-container">
          <SwapOutlined
            className={`swap-icon ${isAnimating ? "spin" : ""}`}
            style={{ fontSize: "48px", color: "#1890ff" }} // Tăng kích thước để nổi bật hơn
          />
        </div>

        {/* Bên phải: Chọn học sinh để hoán đổi */}
        <div className={`student-info ${isAnimating ? "slide-left" : ""}`}>
          <Title style={{ marginTop: "-30px" }} level={5}>
            Chọn học sinh để hoán đổi
          </Title>
          <Select
            placeholder="Tìm kiếm học sinh để hoán đổi"
            style={{ width: "100%", marginBottom: 20 }}
            onChange={(value) => setSelectedStudent(value)}
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            size="large"
            disabled={isAnimating}
          >
            {usersInSmt
              .filter(
                (user) =>
                  user.role === 4 &&
                  user._id !== student._id &&
                  user.classId?._id &&
                  user.classId?._id !== currentStudentClassId // Loại bỏ học sinh cùng lớp
              )
              .map((user) => (
                <Option
                  key={user._id}
                  value={user._id}
                  label={`${user.username} - ${user.rollNumber} (${user.email})`}
                >
                  {user.username} - {user.rollNumber} ({user.email})
                </Option>
              ))}
          </Select>

          {/* Preview thông tin học sinh được chọn */}
          {selectedStudent && (
            <Card className={`student-card preview-card show`}>
              <Descriptions column={1} bordered={false}>
                <Descriptions.Item label={<b>Tên</b>}>
                  {
                    usersInSmt.find((user) => user._id === selectedStudent)
                      ?.username
                  }
                </Descriptions.Item>
                <Descriptions.Item label={<b>Email</b>}>
                  {
                    usersInSmt.find((user) => user._id === selectedStudent)
                      ?.email
                  }
                </Descriptions.Item>
                <Descriptions.Item label={<b>MSSV</b>}>
                  {
                    usersInSmt.find((user) => user._id === selectedStudent)
                      ?.rollNumber
                  }
                </Descriptions.Item>
                <Descriptions.Item label={<b>Lớp hiện tại</b>}>
                  <span style={{ color: "#4682B4", fontWeight: "bold" }}>
                    {selectedStudentClass}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={<b>Lớp mới</b>} className="new-class">
                  <span style={{ color: "green" }}>{currentStudentClass}</span>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SwapClassModal;
