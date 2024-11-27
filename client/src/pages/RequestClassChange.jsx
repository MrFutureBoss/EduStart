import React, { useEffect, useState } from "react";
import { Card, Button, Modal, Select, Input, List, message } from "antd";
import "./RequestClassChange.css";

const { Option } = Select;
const { TextArea } = Input;

const RequestClassChange = ({ currentUserId, currentClassId, refreshData }) => {
  const [availableClasses, setAvailableClasses] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [reason, setReason] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAvailableClasses();
    fetchChangeRequests();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const response = await fetch(`/api/classes/available`);
      const data = await response.json();
      if (!data.classes.length) {
        message.info("Không có lớp nào khả dụng.");
      }
      setAvailableClasses(data.classes);
    } catch (error) {
      message.error("Không thể lấy danh sách các lớp khả dụng.");
    }
  };

  const fetchChangeRequests = async () => {
    try {
      const response = await fetch(`/api/requests/user/${currentUserId}`);
      const data = await response.json();
      setChangeRequests(data.data);
    } catch (error) {
      message.error("Không thể lấy danh sách yêu cầu.");
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedClass) {
      message.error("Vui lòng chọn lớp.");
      return;
    }

    try {
      const response = await fetch(`/api/requests/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUserId,
          currentClassId,
          requestedClassId: selectedClass,
          reason,
        }),
      });

      if (response.ok) {
        message.success("Tạo yêu cầu thành công!");
        fetchChangeRequests();
        refreshData();
        setIsModalOpen(false);
        setSelectedClass(null);
        setReason("");
      } else {
        const errorData = await response.json();
        message.error(errorData.message || "Không thể tạo yêu cầu.");
      }
    } catch (error) {
      message.error("Lỗi khi tạo yêu cầu.");
    }
  };

  return (
    <div className="request-class-container">
      <h2 className="request-class-title">Yêu Cầu Chuyển Lớp</h2>

      <Button
        type="primary"
        onClick={() => setIsModalOpen(true)}
        className="create-request-button"
      >
        Tạo Yêu Cầu
      </Button>

      <Modal
        title="Tạo Yêu Cầu Chuyển Lớp"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreateRequest}
        okText="Gửi Yêu Cầu"
      >
        <Select
          placeholder="Chọn lớp"
          style={{ width: "100%", marginBottom: 20 }}
          onChange={(value) => setSelectedClass(value)}
        >
          {availableClasses.map((cls) => (
            <Option key={cls._id} value={cls._id}>
              {cls.className} (Số lượng: {cls.limitStudent})
            </Option>
          ))}
        </Select>

        <TextArea
          placeholder="Lý do chuyển lớp"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>

      <h3>Danh Sách Yêu Cầu Của Bạn</h3>
      <List
        dataSource={changeRequests}
        renderItem={(item) => (
          <List.Item>
            <Card title={`Chuyển đến: ${item.requestedClassId.className}`}>
              <p>Trạng thái: {item.status}</p>
              <p>Lý do: {item.reason || "Không có lý do được cung cấp"}</p>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default RequestClassChange
