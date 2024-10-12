import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
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

const { Option } = Select;
const { Title } = Typography;

const PendingUsers = () => {
  const dispatch = useDispatch();
  const { currentSemester } = useSelector((state) => state.semester);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [isAssignClassModalVisible, setIsAssignClassModalVisible] =
    useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false); // Loading khi lấy data

  const fetchCurrentSemester = useCallback(async () => {
    try {
      const currentresponse = await axios.get(`${BASE_URL}/semester/current`);
      const semester = currentresponse.data;
      dispatch(setCurrentSemester(semester));
    } catch (err) {
      dispatch(setError(err.message));
    }
  });

  const fetchPendingUsers = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/admins/pending-user/${currentSemester?._id}`
      );
      setPendingUsers(response.data.pendingUsers);
    } catch (error) {
      message.error("Lỗi khi lấy danh sách học sinh Pending.");
    } finally {
      setLoadingData(false);
    }
  }, [currentSemester?._id]);

  useEffect(() => {
    if (currentSemester?._id) {
      fetchPendingUsers();
    } else {
      fetchCurrentSemester();
    }
  }, [currentSemester?._id, fetchPendingUsers]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/admins/${currentSemester?._id}/available/class`
      );
      setClassesList(response.data.classes);
    } catch (error) {
      message.error("Lỗi khi lấy danh sách lớp.");
    }
  };

  const showAssignClassModal = (student) => {
    setSelectedStudent(student);
    setIsAssignClassModalVisible(true);
    fetchClasses();
  };

  const handleAssignClassModalCancel = () => {
    setIsAssignClassModalVisible(false);
    setSelectedStudent(null);
  };

  const handleAssignClass = async (values) => {
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/admins/assign/student`, {
        userId: selectedStudent._id,
        classId: values.classId,
      });
      message.success("Thêm vào lớp thành công");

      setPendingUsers((prev) =>
        prev.filter((user) => user._id !== selectedStudent._id)
      );
    } catch (error) {
      message.error("Thêm vào lớp thất bại");
    } finally {
      setLoading(false);
      setIsAssignClassModalVisible(false);
      setSelectedStudent(null);
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
      title: "Hành động",
      key: "action",
      render: (text, record) => (
        <Button type="primary" onClick={() => showAssignClassModal(record)}>
          Thêm vào lớp
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
      ) : pendingUsers.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <Empty
            description={<span>Không có học sinh nào không có lớp.</span>}
          ></Empty>
        </div>
      ) : (
        <Table
          dataSource={pendingUsers}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      )}

      <Modal
        title={`Thêm ${selectedStudent?.username} vào lớp`}
        open={isAssignClassModalVisible}
        onCancel={handleAssignClassModalCancel}
        footer={null}
      >
        <Form onFinish={handleAssignClass}>
          <Form.Item
            name="classId"
            label="Chọn lớp"
            rules={[{ required: true, message: "Vui lòng chọn lớp" }]}
          >
            <Select placeholder="Chọn lớp">
              {classesList.map((cls) => (
                <Option key={cls._id} value={cls._id}>
                  {cls.className} - {cls.remainingSlots} chỗ trống
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PendingUsers;
