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
  BellFilled,
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
        `${BASE_URL}/activity?activityType=outcome&classId=${classId}`,
        config
      );
      const outcomesData = Array.isArray(response.data)
        ? response.data
        : response.data.activities || [];

      const outcomesWithNames = await Promise.all(
        outcomesData.map(async (outcome) => {
          try {
            const outcomeNameResponse = await axios.get(
              `http://localhost:9999/activity/outcome-type/${outcome.outcomeId}`,
              config
            );
            return {
              ...outcome,
              name: outcomeNameResponse.data.name || "Unknown Outcome",
            };
          } catch (error) {
            console.error("Error fetching outcome name:", error);
            return { ...outcome, name: "Unknown Outcome" };
          }
        })
      );

      const today = moment();

      const classMap = classList.reduce((acc, cls) => {
        acc[cls._id] = cls.className;
        return acc;
      }, {});

      const outcomesWithClassNames = outcomesWithNames
        .filter((outcome) => outcome.activityType === "outcome")
        .map((outcome) => ({
          ...outcome,
          className: classMap[outcome.classId] || "Unknown Class",
        }));

      const filteredOutcomes = outcomesWithClassNames.filter((outcome) => {
        const startDate = moment(outcome.startDate);
        const deadline = moment(outcome.deadline);

        const inDateRange =
          today.isSameOrAfter(startDate, "day") &&
          today.isSameOrBefore(deadline, "day");

        return (
          outcome.className.toLowerCase() === className.toLowerCase() &&
          inDateRange
        );
      });

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
      const response = await axios.patch(
        `${BASE_URL}/activity/update-outcome/${outcomeId}`,
        { newDeadline },
        config
      );

      message.success("Hạn nộp được sửa đổi thành công.");
      fetchOutcomes(classId);
      setEditDeadline(null);
    } catch (error) {
      console.error("Error updating deadline:", error);

      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error("Failed to update deadline.");
      }
    }
  };

  const renderOutcomes = (outcomesList, completedStatus) => {
    return outcomesList.map((outcome, index) => {
      const deadline = moment(outcome.deadline, "YYYY-MM-DD");
      const now = moment();
      const daysUntilDeadline = deadline.diff(now, "days");
      const isOverdue = deadline.isBefore(now, "day");
      const isNearDeadline = daysUntilDeadline <= 3 && daysUntilDeadline >= 0;

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
            width: "30%",
            padding: "20px",
            marginBottom: "10px",
            marginRight: "10px",
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
              <span style={{ fontSize: "14px", fontWeight: "bold" }}>
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
              <span style={{ fontWeight: "500" }}>{outcome.name}</span>
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
            {/* Warning message in separate Descriptions.Item */}
            {isNearDeadline && (
              <Descriptions.Item>
                <div
                  style={{
                    color: "red",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Tooltip title="Gửi lời nhắc">
                    <BellFilled style={{ marginRight: "4px" }} />
                  </Tooltip>
                  <span>Chỉ còn {daysUntilDeadline} ngày tới hạn nộp!</span>
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card.Grid>
      );
    });
  };

  return (
    <Layout style={{ padding: "24px", minHeight: "83vh" }}>
      <Divider
        style={{ textAlign: "center", marginBottom: "20px", fontSize: "40px" }}
      >
        Tiến độ nộp outcome của lớp
      </Divider>
      <div>
        <h4 style={{ marginBottom: "20px" }}>Lớp {className}</h4>
        <Tooltip
          title={
            outcomes
              .filter((o) => o.completed)
              .map((outcome) => outcome.groupName || "Unnamed Group")
              .join(", ") || "Chưa có nhóm nào nộp"
          }
        >
          <p style={{ fontSize: "15px" }}>
            Các nhóm đã nộp ({outcomes.filter((o) => o.completed).length}):{" "}
            {outcomes.filter((o) => o.completed).length > 0
              ? outcomes
                  .filter((o) => o.completed)
                  .map((outcome, index) => (
                    <Tag
                      color="green"
                      key={index}
                      style={{ marginBottom: "5px" }}
                    >
                      {outcome.groupName || "Unnamed Group"}
                    </Tag>
                  ))
              : ""}
          </p>
        </Tooltip>
      </div>
      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          sm={24}
          md={18}
          lg={18}
          xl={18}
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Divider
            orientation="center"
            style={{
              fontSize: "18px",
              backgroundColor: "#011936",
              color: "#dad7cd",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              padding: "8px",
              zIndex: "20",
              position: "relative",
              bottom: "1.8rem",
              borderTopRightRadius: "8px",
              borderTopLeftRadius: "8px",
            }}
          >
            Các nhóm chưa nộp{" "}
            <span
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: "24px",
                height: "24px",
                padding: "4px",
                borderRadius: "50%",
                backgroundColor: "red",
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {outcomes.filter((o) => !o.completed).length}
            </span>
          </Divider>
          <Card bordered={false} style={{ backgroundColor: "#f5f5f5" }}>
            {renderOutcomes(
              outcomes.filter((o) => !o.completed),
              false
            )}
          </Card>
        </Col>

        <Col xs={24} sm={24} md={6} lg={6} xl={6}>
          <Card bordered={false} style={{ backgroundColor: "#f5f5f5" }}>
            <MaterialList selectedClassId={classId} />
          </Card>
        </Col>
      </Row>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/teacher-dashboard/class")}
        style={{ fontSize: "16px", color: "#1890ff", float: "left" }}
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
