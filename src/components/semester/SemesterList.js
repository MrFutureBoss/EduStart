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

const { Text } = Typography;

const SemesterList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { semesters, loading, error, sid, currentSemester } = useSelector(
    (state) => state.semester
  );

  const [pagination, setPagination] = useState({ current: 1, pageSize: 9 });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createApiErrors, setCreateApiErrors] = useState(null);
  const [editApiErrors, setEditApiErrors] = useState(null);

  const handleSelectSemester = async (semester) => {
    dispatch(setSemester(semester));
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
    try {
      dispatch(setLoading(true));
      const response = await axios.get(
        `${BASE_URL}/semester/${semester._id}/users`
      );

      dispatch(setUsersInSmt(response.data));
      navigate("/user-semester");
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleEditSemester = () => {
    setIsEditModalVisible(true);
  };

  const handleEditModalOk = async (updatedSemester) => {
    try {
      await axios.put(
        `${BASE_URL}/semester/update/${updatedSemester._id}`,
        updatedSemester
      );
      message.success("Cập nhật thành công!");
      refreshSemesters();
      setIsEditModalVisible(false);
      setEditApiErrors(null);
    } catch (err) {
      handleError(err, setEditApiErrors);
    }
  };

  const handleCreateModalOk = async (newSemester) => {
    try {
      await axios.post(`${BASE_URL}/semester/create`, newSemester);
      message.success("Tạo kỳ học thành công!");
      refreshSemesters();
      setIsCreateModalVisible(false);
      setCreateApiErrors(null);
    } catch (error) {
      handleError(error, setCreateApiErrors);
    }
  };

  const refreshSemesters = async () => {
    try {
      const semestersResponse = await axios.get(`${BASE_URL}/semester/all`);
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "6px",
          marginLeft: "auto",
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
                    {semester.status}
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
        semester={currentSemester}
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

const getStatusColor = (status) => {
  switch (status) {
    case "Upcoming":
      return "blue";
    case "Ongoing":
      return "green";
    case "Finished":
      return "gray";
    default:
      return "default";
  }
};

export default SemesterList;
