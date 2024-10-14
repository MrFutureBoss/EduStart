// src/pages/PendingUsers.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Form,
  Select,
  message,
  Typography,
  Empty,
  Spin,
} from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentSemester, setError } from "../../redux/slice/semesterSlide";
import { useNavigate } from "react-router-dom"; // Import useNavigate để chuyển hướng

const { Option } = Select;
const { Title } = Typography;

const PendingUsers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Sử dụng useNavigate để chuyển hướng
  const { currentSemester } = useSelector((state) => state.semester);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [savingUserIds, setSavingUserIds] = useState([]);
  const jwt = localStorage.getItem("jwt");

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  // Memo hóa fetchCurrentSemester để tránh tái tạo hàm mỗi lần render
  const fetchCurrentSemester = useCallback(async () => {
    try {
      const currentresponse = await axios.get(
        `${BASE_URL}/semester/current`,
        config
      );
      const semester = currentresponse.data;
      dispatch(setCurrentSemester(semester));
    } catch (err) {
      dispatch(setError(err.message));
    }
  }, [dispatch, config]);

  // Memo hóa fetchPendingUsers để tránh tái tạo hàm mỗi lần render
  const fetchPendingUsers = useCallback(async () => {
    if (!currentSemester?._id) return;

    setLoadingData(true);
    try {
      const [usersResponse, classesResponse] = await Promise.all([
        axios.get(
          `${BASE_URL}/admins/pending-user/${currentSemester._id}`,
          config
        ),
        axios.get(
          `${BASE_URL}/admins/${currentSemester._id}/available/class`,
          config
        ),
      ]);

      setPendingUsers(usersResponse.data.pendingUsers);
      setClassesList(classesResponse.data.classes);

      // Gợi ý lớp tự động
      const initialSelectedClasses = {};
      usersResponse.data.pendingUsers.forEach((user) => {
        const suggestedClass = classesResponse.data.classes.reduce(
          (prev, current) => {
            return prev.remainingSlots > current.remainingSlots
              ? prev
              : current;
          },
          classesResponse.data.classes[0]
        );
        initialSelectedClasses[user._id] = suggestedClass
          ? suggestedClass._id
          : null;
      });
      setSelectedClasses(initialSelectedClasses);
    } catch (error) {
      message.error("Lỗi khi lấy danh sách học sinh hoặc lớp.");
    } finally {
      setLoadingData(false);
    }
  }, [currentSemester?._id, config]);

  useEffect(() => {
    const fetchData = async () => {
      if (currentSemester?._id) {
        fetchPendingUsers();
      } else {
        fetchCurrentSemester();
      }
    };
    fetchData();
  }, [currentSemester?._id, fetchPendingUsers, fetchCurrentSemester]);

  const handleClassChange = (userId, classId) => {
    setSelectedClasses((prev) => ({
      ...prev,
      [userId]: classId,
    }));
  };

  // Hàm lưu riêng cho từng học sinh
  const handleSaveUser = async (userId) => {
    const classId = selectedClasses[userId];
    if (!classId) {
      message.error("Vui lòng chọn lớp trước khi lưu.");
      return;
    }

    setSavingUserIds((prev) => [...prev, userId]);

    try {
      await axios.post(
        `${BASE_URL}/admins/assign/student`,
        {
          userId,
          classId,
        },
        config
      );
      message.success("Học sinh đã được thêm vào lớp thành công.");
      setPendingUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (error) {
      message.error("Thêm vào lớp thất bại.");
    } finally {
      setSavingUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Hàm lưu tất cả các thay đổi
  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const promises = pendingUsers.map((user) =>
        axios.post(
          `${BASE_URL}/admins/assign/student`,
          {
            userId: user._id,
            classId: selectedClasses[user._id],
          },
          config
        )
      );
      await Promise.all(promises);
      message.success("Tất cả học sinh đã được thêm vào lớp thành công.");
      setPendingUsers([]);
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu tất cả.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 4, name: "Học sinh" },
    { id: 2, name: "Giáo viên" },
    { id: 3, name: "Mentor" },
    { id: 5, name: "Người dùng khác" },
  ];

  const columns = [
    {
      title: "Tên",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) =>
        roles.find((r) => r.id === role)?.name || "Không xác định",
    },
    {
      title: "Chọn lớp",
      key: "selectClass",
      render: (text, record) => (
        <Select
          value={selectedClasses[record._id]}
          onChange={(value) => handleClassChange(record._id, value)}
          style={{ width: "100%" }}
          placeholder="Chọn lớp"
        >
          {classesList.map((cls) => (
            <Option key={cls._id} value={cls._id}>
              {cls.className} - {cls.remainingSlots} chỗ trống
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (text, record) => (
        <Button
          type="primary"
          onClick={() => handleSaveUser(record._id)}
          loading={savingUserIds.includes(record._id)}
        >
          Lưu
        </Button>
      ),
    },
  ];

  return (
    <div className="pending-users" style={{ padding: "20px" }}>
      <Title style={{ marginBottom: 40 }} level={2}>
        Sinh Viên Chưa Được Thêm Vào Lớp - {currentSemester?.name}
      </Title>

      {loadingData ? (
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
      ) : classesList.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <Empty
            description={
              <span>
                Không có lớp nào còn trống trong kỳ học hiện tại.
                <br />
                <Button
                  type="primary"
                  style={{ marginTop: "20px" }}
                  onClick={() => navigate("create-class")}
                >
                  Tạo Lớp Mới
                </Button>
              </span>
            }
          ></Empty>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <Empty
            description={
              <span>Không có học sinh nào đang chờ được thêm vào lớp.</span>
            }
          ></Empty>
        </div>
      ) : (
        <>
          <div
            style={{ textAlign: "right", marginBottom: "20px", marginRight: 3 }}
          >
            <Button type="primary" onClick={handleSaveAll} loading={loading}>
              Lưu Tất Cả
            </Button>
          </div>
          <Table
            dataSource={pendingUsers}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </>
      )}
    </div>
  );
};

export default PendingUsers;
