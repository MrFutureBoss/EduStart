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
        message.info("No classes with available slots.");
      }
      setAvailableClasses(data.classes);
    } catch (error) {
      message.error("Failed to fetch available classes.");
    }
  };

  const fetchChangeRequests = async () => {
    try {
      const response = await fetch(`/api/requests/user/${currentUserId}`);
      const data = await response.json();
      setChangeRequests(data.data);
    } catch (error) {
      message.error("Failed to fetch change requests.");
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedClass) {
      message.error("Please select a class.");
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
        message.success("Request created successfully!");
        fetchChangeRequests();
        refreshData();
        setIsModalOpen(false);
        setSelectedClass(null);
        setReason("");
      } else {
        const errorData = await response.json();
        message.error(errorData.message || "Failed to create request.");
      }
    } catch (error) {
      message.error("Error creating request.");
    }
  };

  return (
    <div className="request-class-container">
      <h2 className="request-class-title">Request to Change Class</h2>

      <Button
        type="primary"
        onClick={() => setIsModalOpen(true)}
        className="create-request-button"
      >
        Create Request
      </Button>

      <Modal
        title="Create Class Change Request"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreateRequest}
        okText="Submit Request"
      >
        <Select
          placeholder="Select a class"
          style={{ width: "100%", marginBottom: 20 }}
          onChange={(value) => setSelectedClass(value)}
        >
          {availableClasses.map((cls) => (
            <Option key={cls._id} value={cls._id}>
              {cls.className} (Slots: {cls.limitStudent})
            </Option>
          ))}
        </Select>

        <TextArea
          placeholder="Reason for change"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>

      <h3>Your Requests</h3>
      <List
        dataSource={changeRequests}
        renderItem={(item) => (
          <List.Item>
            <Card title={`To: ${item.requestedClassId.className}`}>
              <p>Status: {item.status}</p>
              <p>Reason: {item.reason || "No reason provided"}</p>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default RequestClassChange;
