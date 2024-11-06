import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EditOutlined } from "@ant-design/icons";
import {
  Button,
  Space,
  Table,
  Tooltip,
  Spin,
  Modal,
  DatePicker,
  message,
} from "antd";
import moment from "moment";
import axios from "axios";

const TableOutcome = () => {
  const [outcomesData, setOutcomesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeadlineModalVisible, setIsDeadlineModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [newDeadline, setNewDeadline] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOutcomesData = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
        const userId = localStorage.getItem("userId");
        const config = {
          headers: { Authorization: `Bearer ${jwt}` },
        };

        const response = await axios.get(
          `http://localhost:9999/activity/${userId}?activityType=outcome`,
          config
        );

        const outcomes = Array.isArray(response.data)
          ? response.data
          : response.data.activities || [];

        if (!Array.isArray(outcomes)) {
          throw new Error("Expected an array but received something else");
        }

        const today = moment();
        const currentOutcomes = outcomes.filter((outcome) =>
          today.isBetween(
            moment(outcome.startDate),
            moment(outcome.deadline),
            null,
            "[]"
          )
        );
        const seenClasses = new Set();
        const tableData = currentOutcomes
          .filter((outcome) => {
            if (seenClasses.has(outcome.classId?.className)) {
              return false;
            }
            seenClasses.add(outcome.classId?.className);
            return true;
          })
          .map((outcome) => ({
            key: outcome._id,
            className: outcome.classId?.className || "N/A",
            title: outcome.assignmentType,
            startDate: moment(outcome.startDate).format("YYYY-MM-DD"),
            deadline: moment(outcome.deadline).format("YYYY-MM-DD"),
            assignedGroups: 5,
            totalGroups: 5,
            completed: outcome.completed,
          }));

        setOutcomesData(outcomes);
        setFilteredData(tableData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching or processing data:", error);
        message.error("Failed to fetch outcome data.");
        setLoading(false);
      }
    };

    fetchOutcomesData();
  }, []);

  const showEditDeadlineModal = (record) => {
    setCurrentRecord(record);
    setIsDeadlineModalVisible(true);
  };

  const handleCancelDeadlineModal = () => {
    setIsDeadlineModalVisible(false);
    setCurrentRecord(null);
    setNewDeadline(null);
  };

  const handleSubmitDeadline = () => {
    if (!newDeadline) {
      message.error("Please select a new deadline!");
      return;
    }

    const updatedData = filteredData.map((outcome) => {
      if (outcome.key === currentRecord.key) {
        return { ...outcome, deadline: newDeadline.format("YYYY-MM-DD") };
      }
      return outcome;
    });
    setFilteredData(updatedData);
    message.success("Deadline updated successfully!");
    handleCancelDeadlineModal();
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => index + 1,
      width: "5%",
    },
    {
      title: "Class Name",
      dataIndex: "className",
      key: "className",
      width: "20%",
    },
    {
      title: "Assignment Type",
      dataIndex: "title",
      key: "title",
      width: "20%",
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: "15%",
      render: (text) => moment(text).format("DD/MM/YYYY"),
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      key: "deadline",
      width: "15%",
      render: (text, record) => (
        <Space>
          <span>{moment(text).format("DD/MM/YYYY")}</span>
          <Tooltip title="Edit Deadline">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                showEditDeadlineModal(record);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Assigned Groups",
      dataIndex: "assignedGroups",
      key: "assignedGroups",
      width: "15%",
      render: (assignedGroups, record) => (
        <span>
          {assignedGroups}/{record.totalGroups}
        </span>
      ),
    },
    {
      title: "Completed",
      dataIndex: "completed",
      key: "completed",
      width: "10%",
      render: (completed) => (completed ? "Yes" : "No"),
    },
  ];

  const handleRowClick = (record) => {
    navigate(`/teacher-dashboard/class/detail/${record.className}/outcomes`);
  };

  return (
    <div>
      {loading ? (
        <Spin size="large" tip="Loading data..." />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="key"
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: "pointer" },
          })}
          pagination={{ pageSize: 5 }}
        />
      )}

      <Modal
        title={`Edit deadline for "${currentRecord?.title}"`}
        visible={isDeadlineModalVisible}
        onCancel={handleCancelDeadlineModal}
        onOk={handleSubmitDeadline}
        okText="Save"
        cancelText="Cancel"
      >
        <DatePicker
          onChange={(date) => setNewDeadline(date)}
          style={{ width: "100%" }}
          disabledDate={(current) =>
            current && current < moment().startOf("day")
          }
        />
      </Modal>
    </div>
  );
};

export default TableOutcome;
