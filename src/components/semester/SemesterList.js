// SemesterList.js
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  setSid,
  setUsersInSmt,
  setLoading,
  setError,
  setSemesterName,
} from "../../redux/slice/semesterSlide";
import { BASE_URL } from "../../utilities/initialValue";
import { Card, List, Typography, Tag } from "antd";

const { Text } = Typography;

const SemesterList = () => {
  const dispatch = useDispatch();
  const { semesters, loading, error } = useSelector((state) => state.semester);

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

  if (loading) {
    return <p>Đang tải dữ liệu...</p>;
  }

  if (error) {
    return <p>Lỗi: {error}</p>;
  }

  return (
    <div className="semester-list">
      <List
        dataSource={semesters}
        pagination={{
          pageSize: 3,
        }}
        renderItem={(semester) => (
          <List.Item>
            <Card
              hoverable
              style={{ width: "100%", marginBottom: 30 }}
              onClick={() => handleSelectSemester(semester)}
            >
              <h3>{semester.name}</h3>
              <p>
                Bắt đầu: {new Date(semester.startDate).toLocaleDateString()}
              </p>
              <p>Kết thúc: {new Date(semester.endDate).toLocaleDateString()}</p>
              <Text type="secondary">Trạng thái: </Text>
              <Tag color={getStatusColor(semester.status)}>
                {semester.status}
              </Tag>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

// Hàm để xác định màu tag theo trạng thái kỳ học
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
