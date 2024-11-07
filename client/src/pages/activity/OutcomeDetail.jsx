import {
  Col,
  Layout,
  message,
  Row,
  Descriptions,
  Card,
  Divider,
  Tooltip,
  Tag,
  Button,
  DatePicker,
  Modal,
} from "antd";
import {
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  EditOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import MaterialList from "./MaterialList";
import { BASE_URL } from "../../utilities/initalValue";
import axios from "axios";
import { setClassList } from "../../redux/slice/ClassSlice";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";

const OutcomeDetail = () => {
  const dispatch = useDispatch();
  const classList = useSelector((state) => state.class.classList);
  const [classId, setClassId] = useState(null);
  const [outcomes, setOutcomes] = useState([]);
  const [editDeadline, setEditDeadline] = useState(null);
  const jwt = localStorage.getItem("jwt");
  const { className } = useParams();
  const navigate = useNavigate();

  const config = {
    headers: { Authorization: `Bearer ${jwt}` },
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/${localStorage.getItem("userId")}/user`,
          config
        );
        dispatch(setClassList(response.data));
      } catch (error) {
        message.error("Error fetching class list");
      }
    };
    if (classList?.length === 0) {
      fetchClasses();
    }
  }, [classList?.length, dispatch, config]);

  useEffect(() => {
    if (className && classList?.length > 0) {
      const selectedClass = classList.find(
        (cls) => cls.className.toLowerCase() === className.toLowerCase()
      );
      if (selectedClass) {
        setClassId(selectedClass._id);
        fetchOutcomes(selectedClass._id);
      } else {
        message.error("Class not found");
      }
    }
  }, [className, classList]);

  const fetchOutcomes = async (classId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity/${classId}?activityType=outcome`,
        config
      );

      const outcomesData = response.data.activities || [];
      const today = moment();

      const filteredOutcomes = outcomesData.filter(
        (outcome) =>
          outcome.classId?.className.toLowerCase() ===
            className.toLowerCase() &&
          today.isBetween(
            moment(outcome.startDate),
            moment(outcome.deadline),
            null,
            "[]"
          )
      );

      const outcomesWithGroups = await Promise.all(
        filteredOutcomes.map(async (outcome) => {
          if (outcome.groupId) {
            try {
              const groupResponse = await axios.get(
                `${BASE_URL}/group/group-infor/${outcome.groupId}`,
                config
              );

              const groupName = groupResponse.data[0]?.name;

              return { ...outcome, groupName };
            } catch (error) {
              console.error("Error fetching group name:", error);
              return { ...outcome, groupName: "Unknown Group" };
            }
          } else {
            console.warn("No groupId found for outcome:", outcome);
            return { ...outcome, groupName: "No Group Assigned" };
          }
        })
      );

      setOutcomes(outcomesWithGroups);
    } catch (error) {
      console.error("Error fetching outcomes:", error);
      message.error("Failed to fetch outcomes for this class.");
    }
  };

  const handleUpdateDeadline = async (outcomeId, newDeadline) => {
    try {
      const currentDeadline = moment(editDeadline.deadline);
      const maxDeadline = currentDeadline.clone().add(7, "days");

      if (moment(newDeadline).isAfter(maxDeadline, "day")) {
        message.error(
          "Deadline must be within 7 days from the current deadline."
        );
        return;
      }

      await axios.patch(
        `${BASE_URL}/activity/update-outcome/${outcomeId}`,
        { newDeadline },
        config
      );

      message.success("Hạn nộp được sửa đổi thành công.");
      fetchOutcomes(classId);
      setEditDeadline(null);
    } catch (error) {
      console.error("Error updating deadline:", error);
      message.error("Failed to update deadline.");
    }
  };

  const renderOutcomes = (outcomesList, completedStatus) => {
    if (outcomesList.length === 0) {
      return (
        <p style={{ padding: "10px", color: "#888" }}>
          {completedStatus
            ? "Chưa có nhóm nào nộp bài"
            : "Tất cả các nhóm đã nộp"}
        </p>
      );
    }

    return outcomesList.map((outcome, index) => {
      const deadline = moment(outcome.deadline, "YYYY-MM-DD");
      const now = moment();
      const isOverdue = deadline.isBefore(now, "day");
      const isNearDeadline = deadline.diff(now, "days") <= 3 && !isOverdue;

      let deadlineColor = "#1890ff";
      if (isOverdue) {
        deadlineColor = "#f5222d";
      } else if (isNearDeadline) {
        deadlineColor = "#faad14";
      }

      return (
        <Card.Grid
          key={index}
          style={{
            width: "50%",
            padding: "20px",
            marginBottom: "20px",
            backgroundColor: completedStatus ? "#e6fffb" : "#fffbe6",
            borderLeft: completedStatus
              ? "4px solid #52c41a"
              : "4px solid #faad14",
            borderRadius: "8px",
          }}
        >
          <Descriptions
            column={1}
            size="small"
            title={
              <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                {outcome.groupName || "Unnamed Group"}
              </span>
            }
            extra={
              !completedStatus && (
                <Tooltip title="Edit deadline">
                  <EditOutlined
                    style={{ cursor: "pointer", color: "#1890ff" }}
                    onClick={() => setEditDeadline(outcome)}
                  />
                </Tooltip>
              )
            }
          >
            <Descriptions.Item label="Loại">
              <span style={{ fontWeight: "500" }}>
                {outcome.assignmentType}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Hạn Nộp">
              <span style={{ color: deadlineColor, fontWeight: "bold" }}>
                {deadline.isValid() ? deadline.format("DD/MM/YYYY") : "N/A"}
              </span>
              {isOverdue && (
                <Tooltip title="Deadline đã quá hạn">
                  <ExclamationCircleOutlined
                    style={{ color: "red", marginLeft: "8px" }}
                  />
                </Tooltip>
              )}
              {isNearDeadline && !isOverdue && (
                <Tooltip title="Deadline sắp đến">
                  <ExclamationCircleOutlined
                    style={{ color: "orange", marginLeft: "8px" }}
                  />
                </Tooltip>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={completedStatus ? "green" : "orange"}>
                {completedStatus ? "Đã nộp" : "Chưa nộp"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card.Grid>
      );
    });
  };

  return (
    <Layout style={{ backgroundColor: "white", padding: "24px" }}>
      <Divider
        style={{ textAlign: "center", marginBottom: "20px", fontSize: "40px" }}
      >
        Quản lý Outcome
      </Divider>
      <h4 style={{ textAlign: "center", marginBottom: "30px" }}>
        Lớp {className}
      </h4>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={9} lg={9} xl={9}>
          <Divider orientation="left" style={{ fontSize: "18px" }}>
            Danh sách chưa nộp
          </Divider>
          <Card bordered={false}>
            {renderOutcomes(
              outcomes.filter((o) => !o.completed),
              false
            )}
          </Card>
        </Col>

        <Col xs={24} sm={24} md={9} lg={9} xl={9}>
          <Divider orientation="left" style={{ fontSize: "18px" }}>
            Danh sách đã nộp
          </Divider>
          <Card bordered={false}>
            {renderOutcomes(
              outcomes.filter((o) => o.completed),
              true
            )}
          </Card>
        </Col>

        <Col xs={24} sm={24} md={6} lg={6} xl={6}>
          <Card bordered={false}>
            <MaterialList selectedClassId={classId} />
          </Card>
        </Col>
      </Row>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/teacher-dashboard/class")}
        style={{ fontSize: "16px", color: "#1890ff" }}
      >
        Quay trở lại lớp học
      </Button>
      {editDeadline && (
        <Modal
          visible={true}
          title={`Chỉnh sửa hạn nộp cho nhóm ${
            editDeadline.groupName || "Unnamed Group"
          }`}
          onCancel={() => setEditDeadline(null)}
          onOk={() =>
            handleUpdateDeadline(editDeadline._id, editDeadline.deadline)
          }
        >
          <DatePicker
            defaultValue={moment(editDeadline.deadline, "YYYY-MM-DD")}
            onChange={(date) => {
              setEditDeadline((prev) => ({
                ...prev,
                deadline: date ? date.format("YYYY-MM-DD") : prev.deadline,
              }));
            }}
            style={{ width: "100%" }}
            disabledDate={(currentDate) =>
              currentDate && currentDate < moment().startOf("day")
            }
          />
        </Modal>
      )}
    </Layout>
  );
};

export default OutcomeDetail;
