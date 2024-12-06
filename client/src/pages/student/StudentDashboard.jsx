import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  message,
  Alert,
  Timeline,
  Card,
  Badge,
  Row,
  Col,
  Typography,
} from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import "./Dashboard.css";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentStage,
  setGroupStatus,
  setOutcomes,
  setProjectStatus,
} from "../../redux/slice/GroupSlice";

const { Title, Text } = Typography;

const Dashboard = () => {
  const dispatch = useDispatch();
  //   const [groupStatus, setGroupStatus] = useState(null);
  //   const [projectStatus, setProjectStatus] = useState(null);
  //   const [outcomes, setOutcomes] = useState([]);
  //   const [currentStage, setCurrentStage] = useState(1); // Giai đoạn hiện tại: 1 - Vào nhóm, 2 - Cập nhật dự án, 3 - Outcome
  const jwt = localStorage.getItem("jwt");
  const navigate = useNavigate();
  const { groupStatus, projectStatus, outcomes, currentStage } = useSelector(
    (state) => state.group
  );
  const { userLogin } = useSelector((state) => state.user);

  const config = {
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
  };

  // Định nghĩa các giai đoạn
  const stages = [
    { id: 1, title: "Vào nhóm" },
    { id: 2, title: "Cập nhật dự án" },
    { id: 3, title: "Outcome" },
  ];

  useEffect(() => {
    // Kiểm tra trạng thái nhóm
    axios
      .get(`${BASE_URL}/user/check-group`, config)
      .then((response) => {
        dispatch(setGroupStatus(response.data.type));
        // Nếu giáo viên đã tạo nhóm nhưng người dùng chưa vào nhóm
        if (
          response.data.type === "teacherCreatedGroup" &&
          (!response.data.user.groupInfo ||
            response.data.user.groupInfo.length === 0)
        ) {
          setCurrentStage(1); // Vẫn ở giai đoạn 1
          return;
        }
        if (
          response.data.type === "teacherCreatedGroup" &&
          response.data.user.groupInfo &&
          response.data.user.groupInfo.length > 0
        ) {
          dispatch(setCurrentStage(2)); // Chuyển sang giai đoạn 2 nếu đã vào nhóm

          const projectInfo = response.data.user.projectInfo;
          if (projectInfo && projectInfo.length > 0) {
            dispatch(setProjectStatus(projectInfo[0].status));
            // Giả sử các trạng thái dự án có thể là "InProgress", "Changing", "Planning", "Decline", "Completed", vv.
            if (projectInfo[0].status === "InProgress") {
              dispatch(setCurrentStage(3)); // Chuyển sang giai đoạn 3 nếu đã cập nhật dự án
            }

            // Lấy danh sách outcomes nếu đã cập nhật dự án
            axios
              .get(`${BASE_URL}/user/check-upcoming-outcomes`, config)
              .then((res) => {
                dispatch(setOutcomes(res.data.upcomingOutcomes));
              })
              .catch((err) => {
                message.error("Không thể lấy danh sách outcomes");
              });
          } else {
            dispatch(setProjectStatus("Chưa cập nhật")); // Dự án chưa được cập nhật
          }
        }
      })
      .catch((error) => {
        message.error("Không thể kiểm tra trạng thái nhóm");
      });
  }, [userLogin]);

  const getOutcomeStyle = (outcome) => {
    if (outcome.category === "Past") {
      return outcome.completed
        ? {
            backgroundColor: "#f0f0f0",
            color: "black",
            icon: <CheckCircleOutlined style={{ color: "#00800080" }} />,
          } // Xám và icon dấu tích nếu đã nộp
        : {
            backgroundColor: "#f0f0f0",
            color: "black",
            icon: <CloseCircleOutlined style={{ color: "#ff000069" }} />,
          }; // Xám và icon dấu X nếu chưa nộp
    } else if (outcome.category === "Ongoing") {
      return outcome.completed
        ? {
            backgroundColor: "#d4edda",
            border: "3px solid #c3e6cb",
            color: "black",
            icon: <CheckCircleOutlined style={{ color: "green" }} />,
          } // Xanh lá nhạt nếu đã nộp
        : {
            backgroundColor: "rgb(255 208 125)",
            border: "3px solid rgb(246 171 38)",
            color: "black",
            icon: (
              <ExclamationCircleOutlined style={{ color: "rgb(246 171 38)" }} />
            ),
          }; // Cam nếu chưa nộp
    } else {
      return {
        backgroundColor: "#f0f0f0",
        color: "black",
        icon: <ClockCircleOutlined style={{ color: "#5888cec2" }} />,
      }; // Xanh biển cho Upcoming
    }
  };

  const handleNavigate = () => {
    if (userLogin?.role === 4 && userLogin?.isLeader === true) {
      navigate(`/student/group-detail?tab=update-project`);
    }
  };
  const handleNavigateOutcome = () => {
    if (userLogin?.role === 4 && userLogin?.isLeader === true) {
      navigate(`/student/group-detail?tab=update-outcome`);
    }
  };
  const handleNavigateGroup = () => {
    navigate(`/student/class`);
  };
  return (
    <div style={{ padding: "24px", marginTop: 20 }}>
      <Row gutter={16}>
        {/* Phần bên trái: Timeline các giai đoạn */}
        <Col style={{ paddingRight: 20 }} xs={24} md={8}>
          <Timeline>
            {stages.map((stage) => {
              let status = "future"; // Mặc định là tương lai

              if (stage.id < currentStage) {
                status = "completed";
              } else if (stage.id === currentStage) {
                status = "current";
              }

              // Xác định màu nền và biểu tượng dựa trên trạng thái
              let backgroundColor = "rgb(211 211 211 / 75%)"; // Gray for future
              let icon = <ClockCircleOutlined style={{ color: "#d9d9d9" }} />; // Neutral icon for future

              if (status === "completed") {
                backgroundColor = "#d4edda"; // Light green
                icon = <CheckCircleOutlined style={{ color: "green" }} />;
              } else if (status === "current") {
                backgroundColor = "rgb(255 208 125)"; // Orange
                icon = (
                  <ExclamationCircleOutlined style={{ color: "orange" }} />
                );
              }

              return (
                <Timeline.Item
                  className="custum-timeline"
                  key={stage.id}
                  dot={icon}
                  color="blue"
                >
                  <Card
                    style={{
                      backgroundColor: backgroundColor,
                      color: "black",
                      border: "none",
                      marginBottom: "16px",
                      height: 120,
                      paddingLeft: 11,
                      paddingTop: 12,
                    }}
                  >
                    <Text style={{ fontSize: 18 }} strong>
                      {stage.title}
                    </Text>
                    <p style={{ marginTop: 4 }}>
                      {status === "completed"
                        ? `${stage.title} đã hoàn thành.`
                        : status === "current"
                        ? `${stage.title} đang diễn ra.`
                        : `${stage.title} sắp tới.`}
                    </p>
                  </Card>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Col>

        {/* Phần bên phải: Hiển thị nội dung tương ứng với giai đoạn hiện tại */}
        <Col
          style={{ borderLeft: "2px dotted gainsboro", paddingLeft: 20 }}
          xs={24}
          md={16}
        >
          {currentStage === 1 && (
            <>
              <Title level={4}>Vào nhóm</Title>
              {groupStatus === "teacherCreatedGroup" ? (
                <Card
                  onClick={handleNavigateGroup}
                  className="blinking-card"
                  hoverable
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#ffecb3",
                    borderColor: "#ffc107",
                    cursor: "pointer",
                  }}
                >
                  <Row align="middle">
                    <ExclamationCircleOutlined
                      style={{
                        color: "#ffc107",
                        fontSize: "24px",
                        marginRight: "10px",
                      }}
                    />
                    <Text strong>
                      Giáo viên đã tạo nhóm, hãy ấn vào để chọn nhóm.
                    </Text>
                  </Row>
                </Card>
              ) : (
                <Card
                  className="blinking-card"
                  hoverable
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#ffecb3",
                    borderColor: "#ffc107",
                  }}
                >
                  <Row align="middle">
                    <ExclamationCircleOutlined
                      style={{
                        color: "#ffc107",
                        fontSize: "24px",
                        marginRight: "10px",
                      }}
                    />
                    <Text strong>
                      Giáo viên chưa tạo nhóm, hãy chờ giáo viên tạo nhóm để
                      tiếp tục!
                    </Text>
                  </Row>
                </Card>
              )}
            </>
          )}

          {currentStage === 2 && (
            <>
              <Title level={4}>Cập nhật dự án</Title>
              {projectStatus === "Changing" || projectStatus === "Planning" ? (
                <Card
                  hoverable
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#d4edda",
                    borderColor: "#c3e6cb",
                  }}
                >
                  <Row align="middle">
                    <CheckCircleOutlined
                      style={{
                        color: "green",
                        fontSize: "24px",
                        marginRight: "10px",
                      }}
                    />
                    <Text strong>
                      Nhóm của bạn đã cập nhật dự án và đang chờ giáo viên duyệt
                    </Text>
                  </Row>
                </Card>
              ) : (
                <Card
                  onClick={handleNavigate}
                  className="blinking-card"
                  hoverable
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#ffecb3",
                    borderColor: "#ffc107",
                    cursor: "pointer",
                  }}
                >
                  <Row align="middle">
                    <ExclamationCircleOutlined
                      style={{
                        color: "#ffc107",
                        fontSize: "24px",
                        marginRight: "10px",
                      }}
                    />
                    <Text strong>Nhóm của bạn chưa cập nhật dự án.</Text>
                  </Row>
                </Card>
              )}
            </>
          )}

          {currentStage === 3 && (
            <>
              <Title style={{ marginBottom: 20 }} level={3}>
                Danh sách Outcomes
              </Title>
              <Timeline>
                {outcomes?.map((outcome) => {
                  const style = getOutcomeStyle(outcome);
                  return (
                    <Timeline.Item
                      className="custum-timeline"
                      key={outcome.outcomeId}
                      dot={style.icon}
                      color="blue"
                    >
                      <Card
                        style={{
                          backgroundColor: style.backgroundColor,
                          color: style.color,
                          border: style.border || "none",
                          marginBottom: "16px",
                          transition: "transform 0.3s ease",
                        }}
                        hoverable={outcome.category === "Ongoing"}
                        onClick={() => {
                          if (outcome.category === "Ongoing") {
                            handleNavigateOutcome();
                          }
                        }}
                      >
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Text strong style={{ fontSize: "16px" }}>
                              {outcome.outcomeName}
                            </Text>
                          </Col>
                          <Col>
                            {outcome.completed ? (
                              <Badge status="success" text="Đã nộp" />
                            ) : (
                              <Badge status="error" text="Chưa nộp" />
                            )}
                          </Col>
                        </Row>
                        <p>
                          Thời gian:{" "}
                          {new Date(outcome.startDate).toLocaleDateString()} -{" "}
                          {new Date(outcome.deadline).toLocaleDateString()}
                        </p>
                        {outcome.category === "Ongoing" &&
                          !outcome.completed && (
                            <Card
                              className="blinking-card"
                              style={{
                                marginTop: "10px",
                                backgroundColor: "#ffecb3",
                                borderColor: "#ffc107",
                              }}
                            >
                              <Row align="middle">
                                <ExclamationCircleOutlined
                                  style={{
                                    color: "#ffc107",
                                    fontSize: "24px",
                                    marginRight: "10px",
                                  }}
                                />
                                <Text strong>
                                  Bạn có một bài tập đang diễn ra chưa nộp
                                </Text>
                              </Row>
                            </Card>
                          )}
                      </Card>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
