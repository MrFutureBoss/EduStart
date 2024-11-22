import React, { useEffect, useState } from "react";
import { Card, Button, Modal, Select, Input, List, message } from "antd";
import "./RequestClassChange.css"; // Link to the new CSS file

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
      setAvailableClasses(data.classes);
    } catch (error) {
      message.error("Failed to fetch available classes.");
    }
  };

  const fetchChangeRequests = async () => {
    try {
      const response = await fetch(`/api/requests/user/${currentUserId}`);
      const data = await response.json();
      setChangeRequests(data.requests);
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
          userId: currentUserId,
          currentClassId,
          targetClassId: selectedClass,
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
        message.error("Failed to create request.");
      }
    } catch (error) {
      message.error("Error creating request.");
    }
  };

  return (
    <div className="request-class-container">
      <h2 className="request-class-title">Request to Change Class</h2>

      {/* Button to open modal */}
      <div className="create-request-button-container">
        <Button type="primary" className="create-request-button" onClick={() => setIsModalOpen(true)}>
          Create Request
        </Button>
      </div>

      {/* Modal for creating request */}
      <Modal
        title="Create Class Change Request"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreateRequest}
        okText="Submit Request"
        className="create-request-modal"
      >
        <Select
          placeholder="Select a class"
          style={{ width: "100%", marginBottom: 20 }}
          onChange={(value) => setSelectedClass(value)}
          className="select-class-dropdown"
        >
          {availableClasses.map((cls) => (
            <Option key={cls._id} value={cls._id}>
              {cls.name} (Slots available: {cls.remainingSlots})
            </Option>
          ))}
        </Select>

        <TextArea
          placeholder="Reason for change (optional)"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="reason-textarea"
        />
      </Modal>

      {/* List of requests */}
      <h3 className="requests-list-title">Your Requests</h3>
      <List
        dataSource={changeRequests}
        renderItem={(item) => (
          <List.Item className="request-card-container">
            <Card title={`Request to: ${item.targetClassName}`} className="request-card">
              <p>Status: {item.status}</p>
              <p>Reason: {item.reason || "No reason provided"}</p>
            </Card>
          </List.Item>
        )}
        className="requests-list"
      />
    </div>
  );
};

export default RequestClassChange;
