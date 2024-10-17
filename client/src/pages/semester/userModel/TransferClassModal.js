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
import axios from "axios";
import { BASE_URL } from "../../../utilities/initalValue";
import "./TransferClassModal.css"; // Import CSS file for styling

const { Option } = Select;
const { Title } = Typography;

const TransferClassModal = ({
  visible,
  onCancel,
  student,
  refreshData,
  currentSemester,
}) => {
  const [availableClasses, setAvailableClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // State cho animation
  const jwt = localStorage.getItem("jwt");

  const config = {
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
  };

  // Lấy danh sách lớp còn slot
  useEffect(() => {
    if (currentSemester?._id && visible) {
      fetchAvailableClasses();
    }
  }, [currentSemester?._id, visible]);

  useEffect(() => {
    // Sau khi có availableClasses, lọc ra những lớp không phải lớp hiện tại
    if (availableClasses.length > 0 && student?.classId?._id) {
      const filtered = availableClasses.filter(
        (cls) => cls._id !== student.classId._id
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses(availableClasses);
    }
  }, [availableClasses, student]);

  const fetchAvailableClasses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/admins/${currentSemester?._id}/available/class`,
        config
      );
      setAvailableClasses(response.data.classes);
    } catch (error) {
      message.error("Lỗi khi lấy danh sách lớp.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedClass) {
      message.error("Vui lòng chọn lớp mới.");
      return;
    }

    try {
      // Thực hiện chuyển lớp
      await axios.post(
        `${BASE_URL}/admins/transfer`,
        { studentId: student._id, toClassId: selectedClass },
        config
      );
      message.success("Chuyển lớp thành công!");

      // Bắt đầu animation
      setIsAnimating(true);

      // Chờ animation hoàn tất trước khi đóng modal và refresh dữ liệu
      setTimeout(() => {
        setIsAnimating(false);
        onCancel();
        refreshData();
      }, 1000); // Thời gian phải khớp với CSS animation
    } catch (error) {
      message.error("Lỗi khi chuyển lớp. Vui lòng thử lại sau.");
    }
  };

  return (
    <Modal
      title={`Chuyển lớp cho học sinh: ${student?.username}`}
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
          onClick={handleTransfer}
          disabled={!selectedClass || isAnimating}
        >
          Chuyển lớp
        </Button>,
      ]}
      destroyOnClose={true} // Đảm bảo modal được reset khi đóng
    >
      <div className={`transfer-container ${isAnimating ? "active" : ""}`}>
        {/* Bên trái: Thông tin học sinh */}
        <div className={`student-info ${isAnimating ? "slide-right" : ""}`}>
          <Title style={{ marginBottom: "20px", marginTop: 11 }} level={5}>
            Thông tin học sinh
          </Title>
          <Card bordered={true} className="student-card">
            <Descriptions column={1} bordered={false}>
              <Descriptions.Item label={<b>Tên</b>}>
                {student?.username}
              </Descriptions.Item>
              <Descriptions.Item label={<b>MSSV</b>}>
                {student?.rollNumber}
              </Descriptions.Item>
              <Descriptions.Item label={<b>Lớp hiện tại</b>}>
                {student?.classId?.className || "Chưa có lớp"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        {/* Mũi tên chuyển đổi */}
        <div className="swap-arrow-container">
          <div className="swap-arrow"></div>
        </div>

        {/* Bên phải: Thông tin lớp mới */}
        <div className="new-class-info">
          <Title style={{ marginTop: "-30px" }} level={5}>
            Chọn lớp mới
          </Title>
          <Select
            placeholder="Chọn lớp mới"
            style={{ width: "100%", marginBottom: 20 }}
            onChange={(value) => setSelectedClass(value)}
            loading={loading}
            size="large"
            disabled={isAnimating}
          >
            {filteredClasses.map((cls) => (
              <Option key={cls._id} value={cls._id}>
                {cls.className} (Còn {cls.remainingSlots} chỗ)
              </Option>
            ))}
          </Select>

          {/* Preview lớp mới */}
          {selectedClass && (
            <Card
              bordered={true}
              className={`class-preview ${isAnimating ? "fade-out" : "show"}`}
            >
              <Title level={5}>Xem trước lớp mới</Title>
              <Descriptions column={1} bordered={false}>
                <Descriptions.Item label="Tên lớp">
                  <span className="highlight">
                    {
                      filteredClasses.find((cls) => cls._id === selectedClass)
                        ?.className
                    }
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng chỗ còn lại">
                  {
                    filteredClasses.find((cls) => cls._id === selectedClass)
                      ?.remainingSlots
                  }
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </div>
      </div>

      {/* Hiển thị Checkmark thành công nếu cần */}
      {/* <div className="success-checkmark">
        <div className="checkmark"></div>
      </div> */}
    </Modal>
  );
};

export default TransferClassModal;
