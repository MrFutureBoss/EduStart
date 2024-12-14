import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  setSid,
  setUsersInSmt,
  setLoading,
  setError,
  setSemesterName,
  setSemesters,
  setCounts,
  setSemester,
  setCurrentSemester,
  setDetailSemester,
} from "../../redux/slice/semesterSlide";
import { BASE_URL } from "../../utilities/initalValue";
import {
  Card,
  List,
  Typography,
  Tag,
  Button,
  message,
  Spin,
  Row,
  Col,
} from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import EditSemesterModal from "./semesterModel/EditSemesterModel";
import CreateSemesterModal from "./semesterModel/CreateSemesterModel";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../../layouts/admin/AdminHeader";

const { Text } = Typography;

const SemesterList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { semesters, loading, error, sid, currentSemester, semester } =
    useSelector((state) => state.semester);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 9 });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createApiErrors, setCreateApiErrors] = useState(null);
  const [editApiErrors, setEditApiErrors] = useState(null);
  const jwt = localStorage.getItem("jwt");

  const config = {
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
  };

  const handleSelectSemester = async (semester) => {
    if (semester?._id !== currentSemester?._id) {
      dispatch(setSemester(semester));
      dispatch(setSid(semester?._id));
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
        })
      );
    } else {
      dispatch(setSid(semester?._id));
      dispatch(
        setCounts({
          studentCount: currentSemester.studentCount,
          teacherCount: currentSemester.teacherCount,
          mentorCount: currentSemester.mentorCount,
          classCount: currentSemester.classCount,
          endDate: currentSemester.endDate,
          startDate: currentSemester.startDate,
          semesterName: currentSemester.name,
          status: currentSemester.status,
          studentsWithClass: currentSemester.studentsWithClass,
          studentsWithoutClass: currentSemester.studentsWithoutClass,
          teachersWithClassCount: currentSemester.teachersWithClassCount,
          teachersWithoutClassCount: currentSemester.teachersWithoutClassCount,
          classesWithStudentsCount: currentSemester.classesWithStudentsCount,
          classesWithoutStudentsCount:
            currentSemester.classesWithoutStudentsCount,
        })
      );
      dispatch(
        setDetailSemester({
          classesWithStudentsList:
            currentSemester.details.classesWithStudentsList,
          classesWithoutStudentsList:
            currentSemester.details.classesWithoutStudentsList,
          teachersWithClasses: currentSemester.details.teachersWithClasses,
          teachersWithoutClasses:
            currentSemester.details.teachersWithoutClasses,
          mentorsWithMatch: currentSemester.details.mentorsWithMatch,
          mentorsWithoutMatch: currentSemester.details.mentorsWithoutMatch,
        })
      );
    }

    try {
      dispatch(setLoading(true));
      const response = await axios.get(
        `${BASE_URL}/semester/${semester._id}/users`,
        config
      );

      dispatch(setUsersInSmt(response.data));
      navigate("/admin/dashboard");
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleEditSemester = (semester) => {
    setIsEditModalVisible(true);
    dispatch(setSemester(semester));
  };

  const handleEditModalOk = async (updatedSemester) => {
    try {
      await axios.put(
        `${BASE_URL}/semester/update/${updatedSemester._id}`,
        updatedSemester,
        config
      );
      message.success("Cập nhật thành công!");
      refreshSemesters();
      setIsEditModalVisible(false);
      setEditApiErrors(null);
    } catch (err) {
      handleError(err, setEditApiErrors);
    }
  };

  // const handleCreateModalOk = async (newSemester) => {
  //   try {
  //     await axios.post(`${BASE_URL}/semester/create`, newSemester, config);
  //     message.success("Tạo kỳ học thành công!");
  //     refreshSemesters();
  //     setIsCreateModalVisible(false);
  //     setCreateApiErrors(null);
  //   } catch (error) {
  //     handleError(error, setCreateApiErrors);
  //   }
  // };
  const handleCreateModalOk = async (newSemester) => {
    try {
      // Step 1: Create the semester and retrieve the new semester ID
      const semesterResponse = await axios.post(
        `${BASE_URL}/semester/create`,
        newSemester,
        config
      );
      const semesterId = semesterResponse.data._id; // Extract semester ID

      // Step 2: Add default outcomes with the new semester ID
      await createDefaultOutcomes(semesterId);

      message.success("Kỳ học và outcomes đã được tạo thành công!");
      refreshSemesters();
      setIsCreateModalVisible(false);
      setCreateApiErrors(null);
    } catch (error) {
      handleError(error, setCreateApiErrors);
    }
  };

  const createDefaultOutcomes = async (semesterId) => {
    const defaultOutcomes = [
      { name: "Outcome 1", semesterId },
      { name: "Outcome 2", semesterId },
      { name: "Outcome 3", semesterId },
    ];

    try {
      await Promise.all(
        defaultOutcomes.map((outcome) =>
          axios.post(`${BASE_URL}/activity/outcome-type`, outcome, config)
        )
      );
    } catch (error) {
      console.error("Error creating default outcomes:", error);
      message.error("Đã xảy ra lỗi khi thêm outcomes.");
    }
  };

  const refreshSemesters = async () => {
    try {
      const semestersResponse = await axios.get(
        `${BASE_URL}/semester/all`,
        config
      );
      dispatch(setSemesters(semestersResponse.data));
    } catch (error) {
      dispatch(setError(error.message));
    }
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

  const handlePaginationChange = (page, pageSize) => {
    setPagination({ current: page, pageSize });
  };
  const getStatusText = (status) => {
    switch (status) {
      case "Ongoing":
        return "Đang diễn ra";
      case "Upcoming":
        return "Chuẩn bị diễn ra";
      case "Finished":
        return "Đã kết thúc";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Ongoing":
        return "blue";
      case "Upcoming":
        return "orange";
      case "Finished":
        return "red";
      default:
        return "default";
    }
  };
  if (loading)
    return (
      <Spin
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
        tip="Đang tải dữ liệu..."
        size="large"
      />
    );
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className="semester-list">
      <AdminHeader content="Danh sách kỳ học" />
      <div
        style={{
          justifyContent: "center",
          marginBottom: "30px",
          marginLeft: "auto",
          marginTop: 20,
        }}
      >
        <Button
          style={{ backgroundColor: "#4682B4", color: "#FFF" }}
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalVisible(true)}
        />
      </div>

      <List
        grid={{ gutter: 16, column: 3 }} // Hiển thị thành 3 cột
        dataSource={semesters}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          onChange: handlePaginationChange,
        }}
        renderItem={(semester) => (
          <List.Item>
            <Card
              hoverable
              style={{
                width: "100%",
                marginBottom: 10,
                border:
                  semester._id === sid
                    ? "2px solid #1890ff"
                    : "1px solid #f0f0f0",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                transition: "border 0.3s, box-shadow 0.3s",
                position: "relative",
              }}
              onClick={() => handleSelectSemester(semester)}
            >
              {(semester.status === "Ongoing" ||
                semester.status === "Upcoming") && (
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    backgroundColor: "#4682B4",
                    color: "#FFF",
                    borderRadius: "50%",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditSemester(semester);
                  }}
                ></Button>
              )}
              <div>
                <h3 style={{ marginBottom: "10px" }}>{semester.name}</h3>
                <div style={{ marginBottom: "10px" }}>
                  <Text type="secondary">Bắt đầu: </Text>
                  {dayjs(semester.startDate).format("DD/MM/YYYY")}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <Text type="secondary">Kết thúc: </Text>
                  {dayjs(semester.endDate).format("DD/MM/YYYY")}
                </div>
                <div>
                  <Text type="secondary">Trạng thái: </Text>
                  <Tag color={getStatusColor(semester.status)}>
                    {getStatusText(semester.status)}
                  </Tag>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <EditSemesterModal
        visible={isEditModalVisible}
        onOk={handleEditModalOk}
        onCancel={() => setIsEditModalVisible(false)}
        semester={semester}
        apiErrors={editApiErrors}
      />
      <CreateSemesterModal
        visible={isCreateModalVisible}
        onOk={handleCreateModalOk}
        onCancel={() => setIsCreateModalVisible(false)}
        apiErrors={createApiErrors}
      />
    </div>
  );
};

export default SemesterList;
