// SemesterList.jsx
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
} from "../../redux/slice/semesterSlide";
import { BASE_URL } from "../../utilities/initalValue";
import {
  Card,
  List,
  Typography,
  Tag,
  Button,
  Dropdown,
  Menu,
  message,
} from "antd";
import {
  EditOutlined,
  EllipsisOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import EditSemesterModal from "./EditSemesterModel";
import CreateSemesterModal from "./CreateSemesterModel";
import dayjs from "dayjs";

const { Text } = Typography;

const SemesterList = () => {
  const dispatch = useDispatch();
  const { semesters, loading, error, sid } = useSelector(
    (state) => state.semester
  );
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [createApiErrors, setCreateApiErrors] = useState(null);
  const [editApiErrors, setEditApiErrors] = useState(null);

  const handleSelectSemester = async (semester) => {
    dispatch(setSid(semester._id));
    dispatch(setSemesterName(semester.name));
    try {
      dispatch(setLoading(true));
      const response = await axios.get(
        `${BASE_URL}/semester/${semester._id}/users`
      );
      dispatch(setUsersInSmt(response.data));
      dispatch(setLoading(false));
    } catch (err) {
      dispatch(setError(err.message));
      dispatch(setLoading(false));
    }
  };

  const handleEditSemester = (semester) => {
    setCurrentSemester(semester);
    setIsEditModalVisible(true);
  };

  const handleEditModalOk = async (updatedSemester) => {
    try {
      await axios.put(
        `${BASE_URL}/semester/update/${updatedSemester._id}`,
        updatedSemester
      );
      setIsEditModalVisible(false);
      setCurrentSemester(null);
      setEditApiErrors(null);
      const semestersResponse = await axios.get(`${BASE_URL}/semester/all`);
      dispatch(setSemesters(semestersResponse.data));
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const errorFields = err.response.data.fields;
        if (errorFields) {
          setEditApiErrors(errorFields);
          console.log(errorFields);
        } else {
          message.error(
            err.response.data.message || "Cập nhật kỳ học thất bại!"
          );
        }
      } else {
        message.error("Có lỗi không mong đợi xảy ra.");
        console.error("Error:", err);
      }
    }
  };
  const handleCreateModalOk = async (newSemester) => {
    try {
      await axios.post(`${BASE_URL}/semester/create`, newSemester);
      setIsCreateModalVisible(false);
      setCreateApiErrors(null);

      const semestersResponse = await axios.get(`${BASE_URL}/semester/all`);
      dispatch(setSemesters(semestersResponse.data));
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const errorFields = error.response.data.fields;

        if (errorFields) {
          setCreateApiErrors(errorFields);
        } else {
          message.error(
            error.response.data.message || "Có lỗi xảy ra khi tạo kỳ học"
          );
        }
      } else {
        message.error("Đã xảy ra lỗi không mong đợi.");
        console.error("Error:", error);
      }
    }
  };

  const handleCreateModalCancel = () => {
    setIsCreateModalVisible(false);
    setCreateApiErrors(null);
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setCurrentSemester(null);
    setEditApiErrors(null);
  };

  const menu = (semester) => (
    <Menu>
      <Menu.Item
        key="edit"
        icon={<EditOutlined />}
        onClick={(e) => {
          e.domEvent.stopPropagation();
          handleEditSemester(semester);
        }}
      >
        Chỉnh sửa
      </Menu.Item>
    </Menu>
  );

  if (loading) {
    return <p>Đang tải dữ liệu...</p>;
  }

  if (error) {
    return <p>Lỗi: {error}</p>;
  }

  return (
    <div className="semester-list">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
          marginLeft: "auto",
        }}
      >
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalVisible(true)}
        />
      </div>

      <List
        dataSource={semesters}
        pagination={{
          pageSize: 3,
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
              <Dropdown overlay={menu(semester)} trigger={["click"]}>
                <Button
                  shape="circle"
                  icon={<EllipsisOutlined />}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    border: "none",
                    boxShadow: "none",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>

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
        onCancel={handleEditModalCancel}
        semester={currentSemester}
        apiErrors={editApiErrors}
      />

      <CreateSemesterModal
        visible={isCreateModalVisible}
        onOk={handleCreateModalOk}
        onCancel={handleCreateModalCancel}
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
