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
import { useParams, useNavigate, Link } from "react-router-dom";
import moment from "moment";
import { IoChevronBackOutline } from "react-icons/io5";

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
          if (outcome.activityType !== "outcome") {
            return { ...outcome, name: "Not an Outcome" };
          }

          if (!outcome.outcomeId) {
            console.warn(`Outcome missing outcomeId:`, outcome);
            return { ...outcome, name: "Unknown Outcome" };
          }

          try {
            const outcomeNameResponse = await axios.get(
              `${BASE_URL}/activity/outcome-type/${outcome.outcomeId}`,
              config
            );
            return {
              ...outcome,
              name: outcomeNameResponse.data.name || "Unknown Outcome",
            };
          } catch (error) {
            console.error(
              `Error fetching outcome name for outcomeId: ${outcome.outcomeId}`,
              error
            );
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

      const outcomesWithDetails = await Promise.all(
        outcomesWithGroups.map(async (outcome) => {
          let groupName = "Unknown Group";
          if (outcome.groupId) {
            try {
              const groupResponse = await axios.get(
                `${BASE_URL}/group/group-infor/${outcome.groupId}`,
                config
              );
              groupName = groupResponse.data[0]?.name || "Unknown Group";
            } catch (error) {
              console.error(
                `Error fetching group name for groupId: ${outcome.groupId}`,
                error
              );
            }
          }

          // Gọi API để lấy file đã nộp
          let files = [];
          try {
            const submissionResponse = await axios.get(
              `${BASE_URL}/submission/group/${outcome.groupId}`,
              config
            );
            files = submissionResponse.data
              .map((submission) => submission.files)
              .flat();
          } catch (error) {
            console.error(
              `Error fetching submissions for groupId: ${outcome.groupId}`,
              error
            );
          }

          return {
            ...outcome,
            groupName,
            files, // Bổ sung thông tin file vào outcome
          };
        })
      );

      setOutcomes(outcomesWithDetails);
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
    const handleSendReminder = (groupName) => {
      Modal.confirm({
        title: "Xác nhận gửi lời nhắc",
        content: `Bạn có chắc chắn muốn gửi lời nhắc tới ${groupName}?`,
        okText: "Gửi",
        cancelText: "Hủy",
        onOk: async () => {
          try {
            // await axios.post(`${BASE_URL}/reminder/send`, { groupName }, config);
            message.success(`Đã gửi lời nhắc tới ${groupName}`);
          } catch (error) {
            console.error("Error sending reminder:", error);
            message.error("Gửi lời nhắc thất bại.");
          }
        },
      });
    };

    return outcomesList.map((outcome, index) => {
      const deadline = moment(outcome.deadline, "YYYY-MM-DD");
      const now = moment();
      const daysUntilDeadline = deadline.diff(now, "days");
      const daysLate = now.diff(deadline, "days");
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
          onClick={() => navigate(`/teacher/group-detail/${outcome.groupId}`)}
          style={{
            width: "20%",
            padding: "5px",
            margin: "0 8px 8px 8px",
            height: "fit-content",
            backgroundColor: completedStatus ? "#e6fffb" : "#fffbe6",
            borderLeft: completedStatus
              ? "4px solid #52c41a"
              : "4px solid #faad14",
            borderRadius: "8px",
            cursor: "pointer",
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditDeadline(outcome);
                    }}
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
            <Descriptions.Item>
              {isOverdue ? (
                <div
                  style={{
                    color: "red",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Tooltip title="Deadline đã quá hạn">
                    <BellFilled style={{ marginRight: "4px" }} />
                  </Tooltip>
                  <span>
                    Đã quá hạn nộp {Math.abs(deadline.diff(now, "hours"))} giờ!
                  </span>
                </div>
              ) : daysUntilDeadline < 1 ? (
                deadline.diff(now, "hours") <= 0 ? (
                  <div
                    style={{
                      color: "red",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Tooltip title="Deadline đã quá hạn">
                      <BellFilled style={{ marginRight: "4px" }} />
                    </Tooltip>
                    <span>
                      Đã quá hạn nộp {Math.abs(deadline.diff(now, "hours"))}{" "}
                      giờ!
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      color: "orange",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Tooltip title="Deadline sắp đến">
                      <BellFilled
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendReminder(outcome.groupName);
                        }}
                        style={{ marginRight: "4px", cursor: "pointer" }}
                      />
                    </Tooltip>
                    <span>
                      Còn {deadline.diff(now, "hours")} giờ tới hạn nộp!
                    </span>
                  </div>
                )
              ) : isNearDeadline ? (
                <div
                  style={{
                    color: "red",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Tooltip title="Gửi lời nhắc">
                    <BellFilled
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendReminder(outcome.groupName);
                      }}
                      style={{ marginRight: "4px", cursor: "pointer" }}
                    />
                  </Tooltip>
                  <span>Còn {daysUntilDeadline} ngày tới hạn nộp!</span>
                </div>
              ) : null}
            </Descriptions.Item>
          </Descriptions>
        </Card.Grid>
      );
    });
  };
  const handleDownload = async (materialUrl) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/submission/download/${materialUrl.split("/").pop()}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", materialUrl.split("/").pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error("Error downloading the file.");
    }
  };
  return (
    <Layout style={{ padding: "0", minHeight: "83vh" }}>
      <Divider
        style={{ textAlign: "center", marginBottom: "20px", fontSize: "30px" }}
      >
        {`Tiến độ nộp ${outcomes[0]?.name || "chưa xác định"} của lớp ${
          className || ""
        }`}
      </Divider>
      <div>
        <p
          style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}
        >
          Tình hình chung:{" "}
          <span style={{ color: "#f5222d" }}>
            {outcomes.filter((o) => !o.completed).length}
          </span>
          {" / "}
          <span style={{ color: "#1890ff" }}>{outcomes.length}</span> nhóm chưa
          nộp
        </p>
        <p style={{ fontSize: "15px", fontWeight: "bold" }}>
          Các nhóm đã nộp ({outcomes.filter((o) => o.completed).length}):{" "}
          {outcomes.filter((o) => o.completed).length > 0
            ? outcomes
                .filter((o) => o.completed)
                .map((outcome, index) => (
                  <Tooltip
                    key={index}
                    title={
                      <div>
                        {outcome.files && outcome.files.length > 0 ? (
                          <p style={{ margin: 0 }}>
                            Tệp đã nộp:{" "}
                            {Array.isArray(outcome.files)
                              ? outcome.files
                                  .map((file) => (
                                    <Link
                                      key={file}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const fileName =
                                          file.name || file.split("/").pop();
                                        handleDownload(fileName);
                                      }}
                                      style={{
                                        marginRight: "8px",
                                        textDecoration: "none",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow =
                                          "0 4px 12px rgba(0, 0, 0, 0.2)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow =
                                          "none";
                                      }}
                                    >
                                      {file.split("/").pop()}
                                    </Link>
                                  ))
                                  .reduce((prev, curr) => [prev, ", ", curr])
                              : outcome.files.split("/").pop()}
                          </p>
                        ) : (
                          <p style={{ margin: 0 }}>Không có tệp đã nộp</p>
                        )}
                      </div>
                    }
                  >
                    <Tag
                      color="green"
                      style={{
                        marginBottom: "5px",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        navigate(`/teacher/group-detail/${outcome.groupId}`)
                      }
                    >
                      {outcome.groupName || "Unnamed Group"}
                    </Tag>
                  </Tooltip>
                ))
            : ""}
        </p>
      </div>
      <Row gutter={[16, 16]} style={{ padding: "0" }}>
        <Col
          xs={24}
          sm={24}
          md={19}
          lg={19}
          xl={19}
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            // boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            padding: "0",
          }}
        >
          <Divider
            orientation="center"
            style={{
              fontSize: "18px",
              backgroundColor: "rgb(96, 178, 199)",
              color: "black",
              // boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              padding: "8px",
              zIndex: "20",
              position: "relative",
              bottom: "0.9rem",
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
                backgroundColor: "rgb(210, 41, 41)",
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {outcomes.filter((o) => !o.completed).length}
            </span>
          </Divider>
          <Card bordered={false} style={{ backgroundColor: "#f5f5f5" }}>
            {outcomes.every((o) => o.completed) ? (
              <p style={{ textAlign: "center", fontSize: "16px" }}>
                Tất cả các nhóm đã nộp
              </p>
            ) : (
              renderOutcomes(
                outcomes.filter((o) => !o.completed),
                false
              )
            )}
          </Card>
        </Col>
        <Col xs={24} sm={24} md={5} lg={5} xl={5} style={{ padding: "0" }}>
          <Card bordered={false} style={{ backgroundColor: "#f5f5f5" }}>
            <MaterialList selectedClassId={classId} />
          </Card>
        </Col>
      </Row>
      <br />
      <Button
        style={{ width: "fit-content" }}
        onClick={() => navigate("/teacher/class")}
      >
        <IoChevronBackOutline /> Quay lại quản lí lớp
      </Button>
      {editDeadline && (
        <Modal
          visible={true} // Hoặc open={true} nếu sử dụng Ant Design v5
          title={`Chỉnh sửa hạn nộp cho nhóm ${
            editDeadline.groupName || "Unnamed Group"
          }`}
          onCancel={() => setEditDeadline(null)}
          onOk={() =>
            handleUpdateDeadline(editDeadline._id, editDeadline.deadline)
          }
        >
          <DatePicker
            // value={moment(editDeadline.deadline, "YYYY-MM-DD")}
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
