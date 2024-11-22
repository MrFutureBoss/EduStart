import React, { useEffect, useState } from "react";
import {
  Layout,
  Breadcrumb,
  Card,
  Row,
  Col,
  List,
  Table,
  Button,
  Tag,
  message,
} from "antd";
import {
  UserOutlined,
  LaptopOutlined,
  NotificationOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationOutlined,
} from "@ant-design/icons";
import {
  checkSemesterStatus,
  checkTeachersInSemester,
  checkMentorsInSemester,
  checkStudentsInSemester,
  checkStudentsPendingStatus,
  checkClassStatus,
  checkTeacherWithoutClassStatus,
  getAllRequetChangClassAdmin,
} from "../../../api";
import { useNavigate } from "react-router-dom";
import SemesterDetailsCard from "../../semester/SemesterDetailsCard";
import { useDispatch, useSelector } from "react-redux";
import { setRoleSelect } from "../../../redux/slice/UserSlice";
import EditSemesterModal from "../../semester/semesterModel/EditSemesterModel";
import { BASE_URL } from "../../../utilities/initalValue";
import axios from "axios";
import {
  setCounts,
  setCurrentSemester,
  setDetailSemester,
  setLoading,
  setSemesterName,
  setSid,
  setUsersInSmt,
} from "../../../redux/slice/semesterSlide";
import {
  setTransferRequestsCount,
  updateTasksStatus,
  updateTaskDetails,
  addAlert,
  setIsLoading,
} from "../../../redux/slice/AdminDashboardSlice";
import "./AdminDashboard.css";
const { Header, Content } = Layout;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editApiErrors, setEditApiErrors] = useState(null);
  const { semester } = useSelector((state) => state.semester);

  const jwt = localStorage.getItem("jwt");

  const config = {
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
  };

  const handleAdjustClick = (role) => {
    dispatch(setRoleSelect(role.id));
    navigate("current-semester", { state: { fromAdmin: true } });
  };

  const fetchCurrentSemester = async () => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get(`${BASE_URL}/semester/current`, config);
      const semester = response.data;
      dispatch(setSid(semester._id));
      dispatch(setSemesterName(semester.name));
      dispatch(
        setCounts({
          studentCount: semester.studentCount,
          teacherCount: semester.teacherCount,
          mentorCount: semester.mentorCount,
          classCount: semester.classCount,
          endDate: semester.endDate,
          startDate: semester.startDate,
          semesterName: semester.name,
          status: semester.status,
          studentsWithClass: semester.studentsWithClass,
          studentsWithoutClass: semester.studentsWithoutClass,
          teachersWithClassCount: semester.teachersWithClassCount,
          teachersWithoutClassCount: semester.teachersWithoutClassCount,
          classesWithStudentsCount: semester.classesWithStudentsCount,
          classesWithoutStudentsCount: semester.classesWithoutStudentsCount,
        })
      );
      dispatch(
        setDetailSemester({
          classesWithStudentsList: semester.details.classesWithStudentsList,
          classesWithoutStudentsList:
            semester.details.classesWithoutStudentsList,
          teachersWithClasses: semester.details.teachersWithClasses,
          teachersWithoutClasses: semester.details.teachersWithoutClasses,
          mentorsWithMatch: semester.details.mentorsWithMatch,
          mentorsWithoutMatch: semester.details.mentorsWithoutMatch,
        })
      );
      const userResponse = await axios.get(
        `${BASE_URL}/semester/${semester._id}/users`,
        config
      );
      dispatch(setUsersInSmt(userResponse.data));
    } catch (error) {
      console.error("Error fetching current semester:", error);
      navigate("admin-dashboard/semester-list");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const { tasksStatus, taskDetails, alerts, transferRequestsCount, isLoading } =
    useSelector((state) => state.adminDashboard);

  const processTasks = () => {
    return [
      {
        key: "createSemester",
        title: "Thiết lập kỳ học mới",
        detail: taskDetails.semesterName,
        isBalanced: taskDetails.semesterName !== "Chưa có",
        requirementMessage:
          taskDetails.semesterName === "Chưa có" ? "Cần thiết lập kỳ học." : "",
      },
      {
        key: "addTeachers",
        title: "Thêm giáo viên vào kỳ học",
        isBalanced:
          taskDetails.teacherCount > 0 &&
          taskDetails.teacherCount >= Math.ceil(taskDetails.studentCount / 30),
        requirementMessage: (() => {
          if (taskDetails.teacherCount === 0) {
            return "Chưa có giáo viên nào được thêm.";
          }
          const requiredTeachers = Math.ceil(taskDetails.studentCount / 30);
          if (taskDetails.teacherCount < requiredTeachers) {
            return `Cần thêm ${
              requiredTeachers - taskDetails.teacherCount
            } giáo viên để đủ cho ${requiredTeachers} lớp.`;
          }
          return "";
        })(),
      },
      {
        key: "addMentors",
        title: "Thêm mentor vào kỳ học",
        isBalanced:
          taskDetails.mentorCount > 0 &&
          taskDetails.mentorCount >= Math.ceil(taskDetails.studentCount / 10),
        requirementMessage: (() => {
          if (taskDetails.mentorCount === 0) {
            return "Chưa có mentor nào được thêm.";
          }
          const requiredMentors = Math.ceil(taskDetails.studentCount / 10);
          if (taskDetails.mentorCount < requiredMentors) {
            return `Cần thêm ${
              requiredMentors - taskDetails.mentorCount
            } mentor để hỗ trợ đầy đủ.`;
          }
          return "";
        })(),
      },
      {
        key: "addStudents",
        title: "Thêm sinh viên vào kỳ học",
        isBalanced: (() => {
          const requiredClasses = Math.ceil(taskDetails.teacherCount);
          const requiredStudents = requiredClasses * 30;
          return (
            taskDetails.studentCount >= requiredStudents &&
            taskDetails.studentsWithoutClass === 0
          );
        })(),
        requirementMessage: (() => {
          if (taskDetails.studentCount === 0) {
            return "Chưa có sinh viên nào được thêm.";
          }
          const requiredClasses = Math.ceil(taskDetails.teacherCount);
          const requiredStudents = requiredClasses * 30;
          if (taskDetails.studentCount < requiredStudents) {
            return `Cần thêm ${
              requiredStudents - taskDetails.studentCount
            } sinh viên để đủ cho ${requiredClasses} lớp (mỗi lớp 30 học sinh).`;
          }
          if (taskDetails.studentsWithoutClass > 0) {
            return `Có ${taskDetails.studentsWithoutClass} sinh viên chưa được phân lớp.`;
          }
          return "";
        })(),
      },
    ];
  };

  const tasksList = processTasks();

  useEffect(() => {
    const fetchClassStatus = async () => {
      try {
        const response = await checkClassStatus();
        const classesNotFull = response.data.data.filter(
          (classItem) => classItem.status === "chưa đủ"
        );

        if (classesNotFull.length > 0) {
          dispatch(
            addAlert({
              type: "warning",
              message: `Có ${classesNotFull.length} lớp chưa đủ số lượng học sinh.`,
              description: `Các lớp chưa đủ: ${classesNotFull
                .map(
                  (classItem) =>
                    `${classItem.className} (${classItem.studentCount}/${classItem.limitStudent})`
                )
                .join(", ")}`,
            })
          );
        }
      } catch (error) {
        console.error("Error checking class capacity:", error);
      }
    };

    fetchClassStatus();
  }, [dispatch]);

  useEffect(() => {
    if (taskDetails.studentsWithoutClass > 0) {
      dispatch(
        addAlert({
          type: "action",
          message: `Có ${taskDetails.studentsWithoutClass} sinh viên chưa có lớp`,
          description: "Nhấn vào đây để phân lớp",
          actionRoute: "pending-users",
          actionText: "Phân lớp",
        })
      );
    }

    checkTeacherWithoutClassStatus()
      .then((response) => {
        if (response.data.data.length > 0) {
          const teacherNames = response.data.data
            .map((teacher) => teacher.username)
            .join(", ");
          const teacherAlert = {
            type: "warning",
            message: "Danh sách giáo viên chưa có lớp",
            description: `Các giáo viên chưa có lớp: ${teacherNames}`,
          };

          dispatch(addAlert(teacherAlert));
        }
      })
      .catch((error) => {
        console.error("Error fetching teachers without classes:", error);
      });
  }, [taskDetails.studentsWithoutClass, dispatch]);

  useEffect(() => {
    checkSemesterStatus()
      .then((response) => {
        dispatch(
          updateTasksStatus({
            createSemester:
              response.data.status === "Ongoing" ||
              response.data.status === "Upcoming",
          })
        );
        dispatch(
          updateTaskDetails({
            semesterName: response.data.semester?.name || "Chưa có",
          })
        );
      })
      .catch((error) =>
        console.error("Error checking semester status:", error)
      );

    checkTeachersInSemester()
      .then((response) => {
        dispatch(
          updateTasksStatus({
            addTeachers: response.data.status === "Teachers found",
          })
        );
        dispatch(
          updateTaskDetails({
            teacherCount: response.data.teachers.length,
          })
        );
      })
      .catch((error) => console.error("Error checking teachers:", error));

    checkMentorsInSemester()
      .then((response) => {
        dispatch(
          updateTasksStatus({
            addMentors: response.data.status === "Mentors found",
          })
        );
        dispatch(
          updateTaskDetails({
            mentorCount: response.data.mentors.length,
          })
        );
      })
      .catch((error) => console.error("Error checking mentors:", error));

    checkStudentsInSemester()
      .then((response) => {
        dispatch(
          updateTasksStatus({
            addStudents: response.data.status === "Student found",
          })
        );
        dispatch(
          updateTaskDetails({
            studentCount: response.data.students.length,
          })
        );
      })
      .catch((error) => console.error("Error checking students:", error));

    checkStudentsPendingStatus()
      .then((response) => {
        dispatch(
          updateTasksStatus({
            studentsPending: response.data.status === "Pending students found",
          })
        );
        dispatch(
          updateTaskDetails({
            studentsWithoutClass: response.data.students.length,
          })
        );
      })
      .catch((error) =>
        console.error("Error checking pending students:", error)
      );
  }, [dispatch]);

  useEffect(() => {
    const fetchTransferRequestsCount = async () => {
      try {
        const response = await getAllRequetChangClassAdmin();
        const pendingRequests = response.data.data.filter(
          (request) => request.status === "pending"
        );
        dispatch(setTransferRequestsCount(pendingRequests.length));

        if (pendingRequests.length > 0) {
          dispatch(
            addAlert({
              type: "action",
              message: `Có ${pendingRequests.length} yêu cầu chuyển lớp`,
              description: "Nhấn vào đây để xem chi tiết",
              actionRoute: "list-request",
              actionText: "Xem yêu cầu",
            })
          );
        }
      } catch (error) {
        console.error("Failed to fetch transfer requests count:", error);
      }
    };

    fetchTransferRequestsCount();
  }, [dispatch]);

  const columns = [
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <span>
          {record.isBalanced ? (
            <CheckCircleOutlined style={{ color: "green", marginRight: 8 }} />
          ) : (
            <WarningOutlined style={{ color: "red", marginRight: 8 }} />
          )}
          {text}
        </span>
      ),
      onCell: (record) => ({
        onClick: () => handleTaskAction(record.key),
        style: { cursor: "pointer" },
      }),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => (
        <span>
          {record.isBalanced ? (
            <Tag color="green">Đã hoàn thành</Tag>
          ) : (
            <Tag color="red">Chưa hoàn thành</Tag>
          )}
          {!record.isBalanced && record.requirementMessage && (
            <div style={{ color: "red", marginTop: 8, fontSize: "12px" }}>
              {record.requirementMessage}
            </div>
          )}
        </span>
      ),
    },
  ];

  const handleTaskAction = (key) => {
    if (key === "createSemester") {
      setIsEditModalVisible(true);
    } else {
      let role;
      if (key === "addTeachers") {
        role = { id: 2, name: "Giáo viên" };
      } else if (key === "addMentors") {
        role = { id: 3, name: "Mentor" };
      } else if (key === "addStudents") {
        role = { id: 4, name: "Học sinh" };
      }
      if (role) {
        dispatch(setRoleSelect(role.id));
        navigate("current-semester", { state: { fromAdmin: true } });
      }
    }
  };
  const handleEditSemester = () => {
    setIsEditModalVisible(true);
  };

  const handleError = (err, setApiErrors) => {
    if (err.response && err.response.status === 400) {
      const errorFields = err.response.data.fields;
      if (errorFields) {
        setApiErrors(errorFields);
      } else {
        message.error(err.response.data.message || "Có lỗi xảy ra.");
      }
    } else {
      message.error("Có lỗi không mong đợi xảy ra.");
    }
  };

  const handleEditModalOk = async (updatedSemester) => {
    try {
      await axios.put(
        `${BASE_URL}/semester/update/${updatedSemester._id}`,
        updatedSemester,
        config
      );
      fetchCurrentSemester();
      message.success("Cập nhật thành công!");
      setIsEditModalVisible(false);
      dispatch(setCurrentSemester(updatedSemester));
      setEditApiErrors(null);
    } catch (err) {
      handleError(err, setEditApiErrors);
    }
  };

  const [showAllWarnings, setShowAllWarnings] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const actionAlerts = alerts.filter((alert) => alert.type === "action");

  return (
    <Layout>
      {/* <h3 className="header-content-mentor-detail">Admin Dashboard</h3> */}
      <div style={{ display: "flex" }}>
        <Content style={{ margin: 0, minHeight: 280 }}>
          {/* Thông báo và cảnh báo */}
          <Row gutter={16} style={{ marginTop: "24px" }}>
            <Col span={12}>
              <Card
                style={{ height: "300px", overflowY: "auto" }}
                title="Thông báo quan trọng"
                bordered={false}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={
                    showAllWarnings
                      ? alerts.filter((alert) => alert.type === "warning")
                      : alerts
                          .filter((alert) => alert.type === "warning")
                          .slice(0, 3)
                  }
                  renderItem={(alert) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <ExclamationCircleOutlined
                            className="warning-alert-admin-dashboard"
                            style={{ fontSize: "20px", color: "#faad14" }}
                          />
                        }
                        title={<strong>{alert.message}</strong>}
                        description={
                          <span style={{ fontSize: "14px" }}>
                            {alert.description}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
                {alerts.filter((alert) => alert.type === "warning").length >
                  3 && (
                  <Button
                    type="link"
                    onClick={() => setShowAllWarnings(!showAllWarnings)}
                    style={{ marginTop: "8px" }}
                  >
                    {showAllWarnings ? "Thu gọn" : "Xem thêm"}
                  </Button>
                )}
              </Card>
            </Col>

            <Col span={12}>
              <Card
                style={{ height: "300px", overflowY: "auto" }}
                title="Việc cần làm"
                bordered={false}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={
                    showAllActions ? actionAlerts : actionAlerts.slice(0, 3)
                  }
                  renderItem={(alert) => (
                    <List.Item
                      extra={
                        alert.actionRoute && (
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <Button
                              type="link"
                              onClick={() => {
                                navigate(alert.actionRoute);
                              }}
                            >
                              {alert.actionText || "Xem chi tiết"}
                            </Button>
                          </div>
                        )
                      }
                    >
                      <List.Item.Meta
                        avatar={
                          <ExclamationOutlined
                            className="warning-alert-admin-dashboard"
                            style={{ fontSize: "24px", color: "#faad14" }}
                          />
                        }
                        title={<strong>{alert.message}</strong>}
                        description={
                          <span style={{ fontSize: "14px" }}>
                            {alert.description}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
                {actionAlerts.length > 3 && (
                  <Button
                    type="link"
                    onClick={() => setShowAllActions(!showAllActions)}
                    style={{ marginTop: "8px" }}
                  >
                    {showAllActions ? "Thu gọn" : "Xem thêm"}
                  </Button>
                )}
              </Card>
            </Col>
          </Row>

          {/* Tổng quan công việc cần làm */}
          <Row gutter={16} style={{ marginTop: "24px" }}>
            <Col span={24}>
              <Card
                title="Công việc cần làm khi có kỳ học mới"
                bordered={false}
              >
                <Table
                  dataSource={tasksList}
                  columns={columns}
                  pagination={false}
                  rowKey="key"
                />
              </Card>
            </Col>
          </Row>
        </Content>
        <SemesterDetailsCard handleEditSemester={handleEditSemester} />
      </div>
      <EditSemesterModal
        visible={isEditModalVisible}
        onOk={handleEditModalOk}
        onCancel={() => setIsEditModalVisible(false)}
        semester={semester}
        apiErrors={editApiErrors}
      />
    </Layout>
  );
};

export default AdminDashboard;
