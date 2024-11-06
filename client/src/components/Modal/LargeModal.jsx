import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EditOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tooltip, Spin, message, DatePicker } from "antd";
import moment from "moment";
import axios from "axios";
import CustomModal from "../../components/Modal/LargeModal";

const TableOutcome = () => {
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [groupData, setGroupData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
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

        const outcomes = Array.isArray(response.data) ? response.data : response.data.activities || [];

        const uniqueClasses = [];
        const uniqueClassData = outcomes.filter((outcome) => {
          if (!uniqueClasses.includes(outcome.classId._id)) {
            uniqueClasses.push(outcome.classId._id);
            return true;
          }
          return false;
        });

        const tableData = uniqueClassData.map((outcome) => ({
          key: outcome._id,
          className: outcome.classId?.className || "N/A",
          title: outcome.assignmentType,
          startDate: moment(outcome.startDate).format("YYYY-MM-DD"),
          deadline: moment(outcome.deadline).format("YYYY-MM-DD"),
          assignedGroups: 5,
          totalGroups: 5,
          completed: outcome.completed,
        }));

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

  const fetchGroupData = async (classId, outcomeType) => {
    try {
      const jwt = localStorage.getItem("jwt");
      const config = {
        headers: { Authorization: `Bearer ${jwt}` },
      };
      const response = await axios.get(
        `http://localhost:9999/group-data/${classId}?outcomeType=${outcomeType}`,
        config
      );
      setGroupData(response.data);
    } catch (error) {
      console.error("Error fetching group data:", error);
      message.error("Failed to fetch group data.");
    }
  };

  const showEditDeadlineModal = async (record) => {
    setCurrentRecord(record);
    await fetchGroupData(record.classId, record.title); // Fetch group data based on classId and outcome type
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setGroupData([]);
  };

  const handleUpdateGroupDeadline = (groupId, newDeadline) => {
    setGroupData((prevData) =>
      prevData.map((group) =>
        group._id === groupId ? { ...group, deadline: newDeadline } : group
      )
    );
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

      <CustomModal
        show={isModalVisible}
        onHide={handleCancelModal}
        title={`Edit Deadline for ${currentRecord?.className} - ${currentRecord?.title}`}
        content={
          <div>
            {groupData.map((group) => (
              <div key={group._id} style={{ marginBottom: "10px" }}>
                <span>{group.name}:</span>
                <DatePicker
                  value={moment(group.deadline)}
                  onChange={(date) => handleUpdateGroupDeadline(group._id, date.format("YYYY-MM-DD"))}
                  style={{ marginLeft: "10px" }}
                />
              </div>
            ))}
          </div>
        }
        footer={
          <Button variant="primary" onClick={() => message.success("Deadlines updated!")}>
            Save Changes
          </Button>
        }
      />
    </div>
  );
};

export default TableOutcome;
