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
import "./TransferClassModal.css";
import { useDispatch, useSelector } from "react-redux";
import { setRecentlyUpdatedUsers } from "../../../redux/slice/UserSlice";
import { updateTransferRequestStatus } from "../../../api";

const { Option } = Select;
const { Title } = Typography;

const TransferClassModal = ({
  visible,
  onCancel,
  student,
  refreshData,
  currentSemester,
  targetClassId,
  requestId,
  isHander,
}) => {
  const dispatch = useDispatch();
  const [availableClasses, setAvailableClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const jwt = localStorage.getItem("jwt");
  const { sid } = useSelector((state) => state.semester);

  const config = {
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
  };

  // Lấy danh sách lớp còn slot khi mở modal
  useEffect(() => {
    if (currentSemester?._id && visible) {
      fetchAvailableClasses();
    }
  }, [currentSemester?._id, visible]);

  const fetchAvailableClasses = async () => {
    setLoading(true);
    try {
      const apiUrl = isHander
        ? `${BASE_URL}/class/all-class/${sid}`
        : `${BASE_URL}/admins/${sid}/available/class`;

      const response = await axios.get(apiUrl, config);

      setAvailableClasses(response.data.classes || response.data);
    } catch (error) {
      message.error("Lỗi khi lấy danh sách lớp.");
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật `filteredClasses` và xử lý `targetClassId` khi có `availableClasses`
  useEffect(() => {
    if (availableClasses.length > 0 && student?.classId?._id) {
      // Lọc các lớp khả dụng để loại bỏ lớp hiện tại của học sinh
      const filtered = availableClasses.filter(
        (cls) => cls._id !== student.classId._id
      );
      setFilteredClasses(filtered);

      // Nếu `targetClassId` có giá trị và nằm trong `filteredClasses`, tự động chọn lớp đó
      if (targetClassId) {
        const targetClassExists = filtered.some(
          (cls) => cls._id === targetClassId
        );

        if (targetClassExists) {
          setSelectedClass(targetClassId); // Đặt `selectedClass` nếu `targetClassId` có trong `filteredClasses`
        } else {
          message.error("Lớp yêu cầu chuyển đến không có chỗ trống.");
          onCancel(); // Đóng modal và từ chối yêu cầu nếu lớp không hợp lệ
        }
      }
    } else {
      setFilteredClasses(availableClasses);
    }
  }, [availableClasses, targetClassId, student]);

  const handleTransfer = async () => {
    if (!selectedClass) {
      message.error("Vui lòng chọn lớp mới.");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/admins/transfer`,
        { studentId: student._id, toClassId: selectedClass },
        config
      );
      message.success("Chuyển lớp thành công!");
      if (requestId) {
        await updateTransferRequestStatus(requestId, "approved");
      }

      // Bắt đầu animation
      setIsAnimating(true);
      dispatch(setRecentlyUpdatedUsers([student._id]));
      setTimeout(() => {
        setIsAnimating(false);
        onCancel();
        refreshData();
      }, 1000);
    } catch (error) {
      message.error("Lỗi khi chuyển lớp. Vui lòng thử lại sau.");
    }
  };

  return (
    <Modal
      title={`Chuyển lớp cho học sinh: ${student?.username}`}
      visible={visible}
      onCancel={onCancel}
      width={1100}
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
      destroyOnClose={true}
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
            value={selectedClass}
          >
            {filteredClasses.map((cls) => (
              <Option key={cls._id} value={cls._id}>
                {cls.remainingSlots > 0
                  ? `${cls.className} Còn ${cls.remainingSlots} chỗ)`
                  : `${cls.className} (đã có
                ${cls.studentCount} sinh viên)`}
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
                <Descriptions.Item
                  label={
                    isHander
                      ? "Số lượng sinh viên trong lớp"
                      : "Số lượng chỗ còn lại"
                  }
                >
                  {filteredClasses.find((cls) => cls._id === selectedClass)?.[
                    isHander ? "studentCount" : "remainingSlots"
                  ] || "Không rõ"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TransferClassModal;
