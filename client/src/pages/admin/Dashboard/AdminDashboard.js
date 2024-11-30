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
  Empty,
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
import { Link, useNavigate } from "react-router-dom";
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
  setSemester,
  setSemesterName,
  setSid,
  setUsersInSmt,
} from "../../../redux/slice/semesterSlide";
import {
  setTransferRequestsCount,
  updateTasksStatus,
  updateTaskDetails,
  setIsLoading,
} from "../../../redux/slice/AdminDashboardSlice";
import "./AdminDashboard.css";
import CreateSemesterModal from "../../semester/semesterModel/CreateSemesterModel";
import dayjs from "dayjs";
const { Header, Content } = Layout;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editApiErrors, setEditApiErrors] = useState(null);
  const [isCreateSemesterVisible, setIsCreateSemesterVisible] = useState(false);

  // Quản lý alerts bằng state thay vì Redux
  const [warnings, setWarnings] = useState([]);
  const [actionAlerts, setActionAlerts] = useState([]);

  const { taskDetails } = useSelector((state) => state.adminDashboard);
  const { semester, sid } = useSelector((state) => state.semester);
  console.log("taskDetails", taskDetails);

  const jwt = localStorage.getItem("jwt");

  const config = {
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
  };

  const fetchCurrentSemester = async () => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get(`${BASE_URL}/semester/current`, config);
      const semester = response.data;
      // dispatch(setSid(semester._id));
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
      navigate("/admin/semester-list");
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (!sid) return;

    // Reset trạng thái cũ trước khi gọi API mới
    dispatch(
      updateTaskDetails({
        studentsWithoutClass: 0,
        studentCount: 0,
        mentorCount: 0,
        teacherCount: 0,
      })
    );
    dispatch(
      updateTasksStatus({
        studentsPending: false,
        addStudents: false,
        addTeachers: false,
        addMentors: false,
      })
    );

    // Gọi API sau khi reset
    checkSemesterStatus();
    checkStudentsPendingStatus(sid).then((response) => {
      const pendingStudents = response.data.students || [];
      dispatch(
        updateTaskDetails({
          studentsWithoutClass: pendingStudents.length,
        })
      );
    });
  }, [sid, dispatch]);

  const handleCreateSemester = async (semester) => {
    try {
      await axios.post(`${BASE_URL}/semester/create`, semester, config);
      message.success("Kỳ học mới đã được tạo thành công!");
      fetchCurrentSemester(); // Tải lại dữ liệu kỳ học
      setIsCreateSemesterVisible(false); // Đóng modal
    } catch (error) {
      console.error("Error creating semester:", error);
      message.error("Không thể tạo kỳ học mới.");
    }
  };

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
        isBalanced: taskDetails.teacherCount > 0, // Kiểm tra đã thêm giáo viên
        requirementMessage:
          taskDetails.teacherCount === 0
            ? "Chưa có giáo viên nào được thêm."
            : "", // Nếu chưa có giáo viên, hiển thị thông báo
      },

      {
        key: "addMentors",
        title: "Thêm người hướng dẫn vào kỳ học",
        isBalanced:
          taskDetails.mentorCount > 0 &&
          taskDetails.mentorCount >= Math.ceil(taskDetails.studentCount / 10),
        requirementMessage: (() => {
          if (taskDetails.mentorCount === 0) {
            return "Chưa có người hướng dẫn nào được thêm.";
          }
          const requiredMentors = Math.ceil(taskDetails.studentCount / 10);
          if (taskDetails.mentorCount < requiredMentors) {
            return `Cần thêm ${
              requiredMentors - taskDetails.mentorCount
            } người hướng dẫn để hỗ trợ đầy đủ.`;
          }
          return "";
        })(),
      },
      {
        key: "addStudents",
        title: "Thêm sinh viên vào kỳ học",
        isBalanced:
          taskDetails.studentCount > 0 && // Có ít nhất 1 sinh viên
          taskDetails.studentCount >= taskDetails.teacherCount * 30 && // Đủ số lượng sinh viên theo lớp
          taskDetails.studentsWithoutClass === 0, // Không còn sinh viên chưa phân lớp
        requirementMessage: (() => {
          if (taskDetails.studentCount === 0) {
            return "Chưa có sinh viên nào được thêm vào kỳ học.";
          }
          const requiredClasses = Math.ceil(taskDetails.teacherCount); // Số lớp cần thiết
          const requiredStudents = requiredClasses * 30; // Số sinh viên cần thiết
          if (taskDetails.studentCount < requiredStudents) {
            return `Cần thêm ${
              requiredStudents - taskDetails.studentCount
            } sinh viên để đủ cho ${requiredClasses} lớp (mỗi lớp 30 sinh viên).`;
          }
          if (taskDetails.studentsWithoutClass > 0) {
            return `Có ${taskDetails.studentsWithoutClass} sinh viên chưa được phân lớp.`;
          }
          return ""; // Trường hợp đã hoàn thành
        })(),
      },
    ];
  };

  const tasksList = processTasks();

  // Thêm cảnh báo về ngày kỳ học
  useEffect(() => {
    const today = dayjs();
    const startDate = dayjs(taskDetails.startDate);
    const endDate = dayjs(taskDetails.endDate);

    const addWarning = (message, description) => {
      setWarnings((prevWarnings) => {
        // Kiểm tra xem cảnh báo đã tồn tại chưa
        if (!prevWarnings.some((alert) => alert.message === message)) {
          return [
            ...prevWarnings,
            {
              type: "warning",
              message: message,
              description: description,
            },
          ];
        }
        return prevWarnings;
      });
    };

    if (
      today.isSameOrAfter(startDate, "day") &&
      today.isSameOrBefore(endDate, "day") &&
      taskDetails.status === "Upcoming"
    ) {
      addWarning(
        <span
          style={{
            textDecoration: "none",
            cursor: "pointer",
          }}
          onClick={() => setIsEditModalVisible(true)}
        >
          Chỉnh sửa trạng thái kỳ học!
        </span>,
        `Bạn cần sử lại trạng thái kỳ học thành "Đang diễn ra" vì thời gian kỳ học đã bắt đầu!`
      );
    }

    if (
      today.isBefore(startDate, "day") &&
      today.add(7, "day").isSameOrAfter(startDate, "day")
    ) {
      addWarning(
        <span
          style={{
            textDecoration: "underline",
            cursor: "pointer",
            color: "blue",
          }}
          onClick={() => setIsEditModalVisible(true)}
        >
          Ngày hiện tại gần đến ngày bắt đầu kỳ học.
        </span>,
        "Hãy kiểm tra và chỉnh sửa trạng thái kỳ học nếu cần."
      );
    }
  }, [taskDetails, semester.status]);

  // Thêm cảnh báo về lớp chưa đủ và giáo viên chưa có lớp
  useEffect(() => {
    let isMounted = true;
    const fetchClassStatus = async () => {
      try {
        const response = await checkClassStatus(semester?._id);
        const classesNotFull = response.data.data.filter(
          (classItem) => classItem.status === "chưa đủ"
        );

        if (isMounted && classesNotFull.length > 0) {
          const message = (
            <span
              style={{
                textDecoration: "none",
                color: "black",
                cursor: "pointer",
              }}
              onClick={() =>
                navigate("/admin/class-manager", {
                  state: { filter: "notFull" },
                })
              }
            >
              Có {classesNotFull.length} lớp chưa đủ số lượng sinh viên.
            </span>
          );
          const description = `Các lớp chưa đủ: ${classesNotFull
            .map(
              (classItem) =>
                `${classItem.className} (${classItem.studentCount}/${classItem.limitStudent})`
            )
            .join(", ")}`;

          setWarnings((prevWarnings) => {
            if (!prevWarnings.some((alert) => alert.message === message)) {
              return [
                ...prevWarnings,
                { type: "warning", message, description },
              ];
            }
            return prevWarnings;
          });
        }
      } catch (error) {
        console.error("Error checking class capacity:", error);
      }
    };

    fetchClassStatus();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Thêm cảnh báo về sinh viên chưa có lớp và giáo viên chưa có lớp
  useEffect(() => {
    if (taskDetails.studentsWithoutClass > 0) {
      const message = `Có ${taskDetails.studentsWithoutClass} sinh viên chưa có lớp`;
      const actionRoute = "/admin/class-manager";
      const actionText = "Phân lớp";

      setActionAlerts((prevActionAlerts) => {
        if (
          !prevActionAlerts.some(
            (alert) =>
              alert.message === message && alert.actionRoute === actionRoute
          )
        ) {
          return [
            ...prevActionAlerts,
            { type: "action", message, actionRoute, actionText },
          ];
        }
        return prevActionAlerts;
      });
    }

    checkTeacherWithoutClassStatus(semester?._id)
      .then((response) => {
        if (response.data.data.length > 0) {
          const teacherNames = response.data.data
            .map((teacher) => teacher.username)
            .join(", ");
          const message = "Danh sách giáo viên chưa có lớp";
          const description = `Các giáo viên chưa có lớp: ${teacherNames}`;

          setWarnings((prevWarnings) => {
            if (!prevWarnings.some((alert) => alert.message === message)) {
              return [
                ...prevWarnings,
                { type: "warning", message, description },
              ];
            }
            return prevWarnings;
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching teachers without classes:", error);
      });
  }, [taskDetails.studentsWithoutClass]);

  // Kiểm tra trạng thái kỳ học và cập nhật tasksStatus, taskDetails
  useEffect(() => {
    if (!sid) return; // Chỉ thực hiện khi `sid` có giá trị

    // Kiểm tra trạng thái kỳ học
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
            startDate: response.data.semester?.startDate,
            endDate: response.data.semester?.endDate,
            status: response.data.semester?.status,
          })
        );
      })
      .catch((error) =>
        console.error("Error checking semester status:", error)
      );

    // Kiểm tra giáo viên trong kỳ học
    checkTeachersInSemester(sid)
      .then((response) => {
        const teachers = response.data.teachers || []; // Đảm bảo `teachers` là một mảng
        dispatch(
          updateTasksStatus({
            addTeachers: response.data.status === "Teachers found",
          })
        );
        dispatch(
          updateTaskDetails({
            teacherCount: teachers.length, // Sử dụng `.length` chỉ khi chắc chắn là mảng
          })
        );
      })
      .catch((error) => console.error("Error checking teachers:", error));

    // Kiểm tra người hướng dẫn trong kỳ học
    checkMentorsInSemester(sid)
      .then((response) => {
        const mentors = response.data.mentors || []; // Đảm bảo `mentors` là một mảng
        dispatch(
          updateTasksStatus({
            addMentors: response.data.status === "Mentors found",
          })
        );
        dispatch(
          updateTaskDetails({
            mentorCount: mentors.length,
          })
        );
      })
      .catch((error) => console.error("Error checking mentors:", error));

    // Kiểm tra sinh viên trong kỳ học
    checkStudentsInSemester(sid)
      .then((response) => {
        const students = response.data.students || []; // Đảm bảo `students` là một mảng
        dispatch(
          updateTasksStatus({
            addStudents: response.data.status === "Student found",
          })
        );
        dispatch(
          updateTaskDetails({
            studentCount: students.length,
          })
        );
      })
      .catch((error) => console.error("Error checking students:", error));

    // Kiểm tra sinh viên chưa có lớp
    checkStudentsPendingStatus(sid)
      .then((response) => {
        const pendingStudents = response.data.students || [];
        console.log("API Response for sid:", sid, response.data);

        if (pendingStudents.length > 0) {
          console.log("Found pending students:", pendingStudents);
          dispatch(
            updateTasksStatus({
              studentsPending: true,
            })
          );
          dispatch(
            updateTaskDetails({
              studentsWithoutClass: pendingStudents.length,
            })
          );
        } else {
          console.log(
            "No pending students found. Clearing state for sid:",
            sid
          );
          dispatch(
            updateTasksStatus({
              studentsPending: false,
            })
          );
          dispatch(
            updateTaskDetails({
              studentsWithoutClass: 0,
            })
          );
        }
      })
      .catch((error) => {
        console.error("Error checking pending students:", error);
      });
  }, [sid, dispatch]);

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
        </span>
      ),
    },
    {
      title: "Gợi ý",
      key: "requirementMessage",
      render: (_, record) => (
        <span>
          {!record.isBalanced && record.requirementMessage && (
            <div style={{ color: "red", fontSize: "13px" }}>
              {record.requirementMessage}
            </div>
          )}
          {record.isBalanced && (
            <div style={{ color: "green", fontSize: "13px" }}>
              Công việc này đã hoàn thành.
            </div>
          )}
        </span>
      ),
    },
  ];

  const handleTaskAction = (key) => {
    if (key === "createSemester") {
      if (semester && semester.name) {
        // Nếu đã có kỳ học, mở modal sửa kỳ học
        setIsEditModalVisible(true);
      } else {
        // Nếu chưa có kỳ học, mở modal tạo kỳ học
        setIsCreateSemesterVisible(true);
      }
    } else {
      let role;
      if (key === "addTeachers") {
        role = { id: 2, name: "Giáo viên" };
      } else if (key === "addMentors") {
        role = { id: 3, name: "Người hướng dẫn" };
      } else if (key === "addStudents") {
        role = { id: 4, name: "Sinh viên" };
      }
      if (role) {
        dispatch(setRoleSelect(role.id));
        navigate("/admin/current-semester", {
          state: { role, fromAdmin: true },
        });
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
      const response = await axios.put(
        `${BASE_URL}/semester/update/${updatedSemester._id}`,
        updatedSemester,
        config
      );
      fetchCurrentSemester();
      message.success("Cập nhật thành công!");
      setIsEditModalVisible(false);
      dispatch(setSemester(updatedSemester));
      const updatedDetails = response.data; // Kỳ học sau khi cập nhật
      dispatch(updateTaskDetails({ ...updatedDetails }));
      setEditApiErrors(null);
    } catch (err) {
      handleError(err, setEditApiErrors);
    }
  };

  const [showAllWarnings, setShowAllWarnings] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);

  return (
    <Layout>
      {/* <h3 className="header-content-mentor-detail">Admin Dashboard</h3> */}
      <div style={{ display: "flex" }}>
        <Content style={{ margin: 0, minHeight: 280 }}>
          {/* Thông báo và cảnh báo */}
          <Row gutter={16} style={{ marginTop: "24px" }}>
            <Col span={12}>
              <Card
                className="admin-card-custum"
                style={{ height: "240px", overflowY: "auto" }}
                title="Thông báo quan trọng"
                bordered={false}
              >
                {warnings.length === 0 ? (
                  // Hiển thị khi không có thông báo quan trọng
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "#888" }}>
                      <Empty description={null}>
                        Bạn không có thông báo quan trọng nào!
                      </Empty>
                    </span>
                  </div>
                ) : (
                  <>
                    <List
                      itemLayout="horizontal"
                      dataSource={
                        showAllWarnings ? warnings : warnings.slice(0, 3)
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
                            title={
                              <strong style={{ fontSize: "13px" }}>
                                {alert.message}
                              </strong>
                            }
                            description={
                              <span style={{ fontSize: "13px" }}>
                                {alert.description}
                              </span>
                            }
                          />
                        </List.Item>
                      )}
                    />
                    {warnings.length > 3 && (
                      <Button
                        type="link"
                        onClick={() => setShowAllWarnings(!showAllWarnings)}
                        style={{ marginTop: "8px" }}
                      >
                        {showAllWarnings ? "Thu gọn" : "Xem thêm"}
                      </Button>
                    )}
                  </>
                )}
              </Card>
            </Col>

            <Col span={12}>
              <Card
                className="admin-card-custum"
                style={{ height: "240px", overflowY: "auto" }}
                title="Việc cần làm"
                bordered={false}
              >
                {actionAlerts.length === 0 ? (
                  // Hiển thị khi không có việc cần làm
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "#888" }}>
                      <Empty description={null}>
                        Bạn không có công việc nào cần xử lý!
                      </Empty>
                    </span>
                  </div>
                ) : (
                  <>
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
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
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
                            title={
                              <strong style={{ fontSize: "13px" }}>
                                {alert.message}
                              </strong>
                            }
                            description={
                              <span style={{ fontSize: "13px" }}>
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
                  </>
                )}
              </Card>
            </Col>
          </Row>

          {/* Tổng quan công việc cần làm */}
          <Row gutter={16} style={{ marginTop: "24px" }}>
            <Col span={24}>
              <Card
                className="admin-card-custum"
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
      <CreateSemesterModal
        visible={isCreateSemesterVisible}
        onOk={handleCreateSemester}
        onCancel={() => setIsCreateSemesterVisible(false)}
        apiErrors={editApiErrors}
      />
    </Layout>
  );
};

export default AdminDashboard;
