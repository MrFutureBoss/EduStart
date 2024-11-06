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
} from "antd";
import { EditOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
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
  const jwt = localStorage.getItem("jwt");
  const { className } = useParams();
  const navigate = useNavigate();

  // Dữ liệu giả ban đầu
  const [outcomes, setOutcomes] = useState([
    {
      groupName: "Nhóm A",
      title: "Outcome 1",
      deadline: "2024-11-03",
      status: "Chưa nộp",
    },
    {
      groupName: "Nhóm B",
      title: "Outcome 1",
      deadline: "2024-11-03",
      status: "Đã nộp",
    },
    {
      groupName: "Nhóm C",
      title: "Outcome 1",
      deadline: "2024-11-03",
      status: "Chưa nộp",
    },
    {
      groupName: "Nhóm D",
      title: "Outcome 1",
      deadline: "2024-11-03",
      status: "Đã nộp",
    },
    {
      groupName: "Nhóm E",
      title: "Outcome 1",
      deadline: "2024-11-03",
      status: "Chưa nộp",
    },
    {
      groupName: "Nhóm F",
      title: "Outcome 1",
      deadline: "2024-11-03",
      status: "Đã nộp",
    },
  ]);

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
      } else {
        message.error("Class not found");
      }
    }
  }, [className, classList]);

  const outcomesCompleted = outcomes.filter(
    (outcome) => outcome.status === "Đã nộp"
  );
  const outcomesPending = outcomes.filter(
    (outcome) => outcome.status === "Chưa nộp"
  );

  const renderOutcomes = (outcomesList, isEditable) => {
    return outcomesList.map((outcome, index) => {
      if (!isEditable) {
        return (
          <Card.Grid
            key={index}
            style={{
              width: "50%",
              padding: "20px",
              backgroundColor: "#e6fffb",
              borderLeft: "4px solid #52c41a",
              marginBottom: "20px",
              borderRadius: "8px",
            }}
          >
            <Descriptions
              column={1}
              size="small"
              title={
                <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                  {outcome.groupName}
                </span>
              }
              extra={
                isEditable && (
                  <Tooltip title="Chỉnh sửa hạn nộp">
                    <EditOutlined
                      onClick={() => handleEditDeadline(outcome)}
                      style={{ cursor: "pointer", color: "#1890ff" }}
                    />
                  </Tooltip>
                )
              }
            >
              <Descriptions.Item label="Tiêu đề">
                <span style={{ fontWeight: "500" }}>
                  {outcome.title || "N/A"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color="green">{outcome.status}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card.Grid>
        );
      }

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
            backgroundColor: "#fffbe6",
            borderLeft: "4px solid #faad14",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <Descriptions
            column={1}
            size="small"
            title={
              <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                {outcome.groupName}
              </span>
            }
            extra={
              isEditable && (
                <Tooltip title="Chỉnh sửa hạn nộp">
                  <EditOutlined
                    onClick={() => handleEditDeadline(outcome)}
                    style={{ cursor: "pointer", color: "#1890ff" }}
                  />
                </Tooltip>
              )
            }
          >
            <Descriptions.Item label="Tiêu đề">
              <span style={{ fontWeight: "500" }}>
                {outcome.title || "N/A"}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Hạn Nộp">
              <span style={{ color: deadlineColor, fontWeight: "bold" }}>
                {deadline.isValid()
                  ? deadline.format("DD/MM/YYYY")
                  : "Chưa có hạn nộp"}
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
              <Tag color="orange">{outcome.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card.Grid>
      );
    });
  };

  const handleEditDeadline = (outcome) => {
    message.info(`Chỉnh sửa hạn nộp cho ${outcome.groupName}`);
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
          <Divider orientation="left" style={{ fontSize: "25px" }}>
            Danh sách chưa nộp
          </Divider>
          <Card bordered={false}>{renderOutcomes(outcomesPending, true)}</Card>
        </Col>

        <Col xs={24} sm={24} md={9} lg={9} xl={9}>
          <Divider orientation="left" style={{ fontSize: "25px" }}>
            Danh sách đã nộp
          </Divider>
          <Card bordered={false}>
            {renderOutcomes(outcomesCompleted, false)}
          </Card>
        </Col>

        <Col xs={24} sm={24} md={6} lg={6} xl={6}>
          <Card bordered={false}>
            <MaterialList selectedClassId={classId} />
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};

export default OutcomeDetail;
