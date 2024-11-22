// src/pages/PendingUsers.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Select,
  message,
  Typography,
  Empty,
  Spin,
  Modal,
  Form,
  Input,
  Alert,
  Row,
  Col,
  Card,
  Statistic,
  InputNumber,
} from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import {
  setClassesList,
  setCurrentSemester,
  setError,
  setFullClassesList,
  setMaxStudentsPerClass,
  setPendingUsers,
  setUsersInSmt,
} from "../../redux/slice/semesterSlide";
import { setRecentlyUpdatedUsers } from "../../redux/slice/UserSlice";
import CustomButton from "../../components/Button/Button";

const { Option } = Select;
const { Title } = Typography;

const PendingUsers = () => {
  const dispatch = useDispatch();
  const {
    currentSemester,
    classesList,
    fullClassesList,
    pendingUsers,
    maxStudentsPerClass,
    semester,
  } = useSelector((state) => state.semester);

  const [selectedClasses, setSelectedClasses] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [savingUserIds, setSavingUserIds] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [classesToCreate, setClassesToCreate] = useState(0);
  const [newClassesData, setNewClassesData] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [isIncreaseLimitModalVisible, setIsIncreaseLimitModalVisible] =
    useState(false);
  const [newMaxStudents, setNewMaxStudents] = useState(maxStudentsPerClass);

  const [allocatedCount, setAllocatedCount] = useState(0); // Số học sinh đã được gợi ý
  const [unallocatedCount, setUnallocatedCount] = useState(0); // Số học sinh chưa được gán
  const [remainingPending, setRemainingPending] = useState([]); // Học sinh chưa được phân bổ sau khi tăng giới hạn

  // Thêm các state mới để tính toán gợi ý thông minh
  const [requiredMaxStudentsPerClass, setRequiredMaxStudentsPerClass] =
    useState(maxStudentsPerClass);
  const [expectedUnallocatedCount, setExpectedUnallocatedCount] = useState(0);

  const [form] = Form.useForm();
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

  // Hàm mở modal tăng giới hạn lớp với tính toán thông minh
  const handleOpenIncreaseLimitModal = () => {
    // Đảm bảo requiredMaxStudentsPerClass không vượt quá 35
    const cappedRequiredMax = Math.min(requiredMaxStudentsPerClass, 35);
    setIsIncreaseLimitModalVisible(true);
    setNewMaxStudents(cappedRequiredMax || maxStudentsPerClass);
  };

  // Fetch danh sách giáo viên
  const fetchTeachers = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/admins/teachers-list`,
        config
      );
      setTeachersList(response.data.teachers);
    } catch (error) {
      message.error("Lỗi khi lấy danh sách giáo viên.");
      console.error("Error fetching teachers:", error);
    }
  }, [config]);

  // Fetch semester hiện tại
  const fetchCurrentSemester = useCallback(async () => {
    try {
      const currentresponse = await axios.get(
        `${BASE_URL}/semester/current`,
        config
      );
      const semester = currentresponse.data;
      dispatch(setCurrentSemester(semester));
      const userResponse = await axios.get(
        `${BASE_URL}/semester/${semester._id}/users`,
        config
      );
      dispatch(setUsersInSmt(userResponse.data));
    } catch (err) {
      dispatch(setError(err.message));
      console.error("Error fetching current semester:", err);
    }
  }, [dispatch, config]);

  // Fetch danh sách lớp
  const fetchClasses = useCallback(async () => {
    if (!currentSemester?._id) return; // Thêm kiểm tra để tránh lỗi khi currentSemester chưa được định nghĩa
    try {
      const [availableClassesResponse, fullClassesResponse] = await Promise.all(
        [
          axios.get(
            `${BASE_URL}/admins/${currentSemester._id}/available/class`,
            config
          ),
          axios.get(
            `${BASE_URL}/admins/${currentSemester._id}/full/classes`,
            config
          ),
        ]
      );

      dispatch(setClassesList(availableClassesResponse.data.classes));
      dispatch(setFullClassesList(fullClassesResponse.data.classes));
    } catch (error) {
      message.error("Lỗi khi lấy danh sách lớp.");
      console.error("Error fetching classes:", error);
    }
  }, [currentSemester?._id, config, dispatch]);

  // Fetch danh sách học sinh đang chờ và lớp
  const fetchPendingUsers = useCallback(async () => {
    if (!currentSemester?._id) return;

    setLoadingData(true);
    try {
      const [usersResponse, availableClassesResponse, fullClassesResponse] =
        await Promise.all([
          axios.get(
            `${BASE_URL}/admins/pending-user/${currentSemester._id}`,
            config
          ),
          axios.get(
            `${BASE_URL}/admins/${currentSemester._id}/available/class`,
            config
          ),
          axios.get(
            `${BASE_URL}/admins/${currentSemester._id}/full/classes`,
            config
          ),
        ]);

      dispatch(setPendingUsers(usersResponse.data.pendingUsers));
      dispatch(setClassesList(availableClassesResponse.data.classes));
      dispatch(setFullClassesList(fullClassesResponse.data.classes));
    } catch (error) {
      message.error("Lỗi khi lấy danh sách học sinh hoặc lớp.");
      console.error("Error fetching pending users:", error);
    } finally {
      setLoadingData(false);
    }
  }, [currentSemester?._id, config, dispatch]);

  // useEffect 1: Fetch data khi currentSemester thay đổi
  useEffect(() => {
    const fetchData = async () => {
      if (currentSemester?._id) {
        await fetchPendingUsers();
        await fetchTeachers();
        await fetchClasses();
      } else {
        await fetchCurrentSemester();
      }
    };
    fetchData();
  }, [
    currentSemester?._id,
    fetchPendingUsers,
    fetchCurrentSemester,
    fetchTeachers,
    fetchClasses,
  ]);

  // useEffect 2: Phân bổ học sinh và tính toán gợi ý thông minh
  useEffect(() => {
    const allocateStudents = () => {
      if (!pendingUsers || pendingUsers.length === 0) {
        setAllocatedCount(0);
        setUnallocatedCount(0);
        setRemainingPending([]);
        setSelectedClasses({});
        setRequiredMaxStudentsPerClass(maxStudentsPerClass);
        setExpectedUnallocatedCount(0);
        return;
      }

      let updatedSelectedClasses = {}; // Không dựa vào selectedClasses hiện tại
      let remaining = [...pendingUsers];

      // Tính số slot còn lại cho từng lớp
      const classSlots = {};

      classesList.forEach((cls) => {
        let remainingSlots = Number(cls.remainingSlots) || 0;
        const limitStudent = Number(cls.limitStudent) || maxStudentsPerClass;
        if (maxStudentsPerClass > limitStudent) {
          remainingSlots += maxStudentsPerClass - limitStudent;
        }
        classSlots[cls._id] = remainingSlots;
      });

      fullClassesList.forEach((cls) => {
        const extraSlots =
          Number(maxStudentsPerClass) - Number(cls.studentCount);
        classSlots[cls._id] = extraSlots > 0 ? extraSlots : 0;
      });

      // Sắp xếp lớp theo số slot còn lại giảm dần
      const sortedClasses = [...classesList, ...fullClassesList].sort(
        (a, b) => (classSlots[b._id] || 0) - (classSlots[a._id] || 0)
      );

      // Phân bổ học sinh vào lớp
      sortedClasses.forEach((cls) => {
        if (remaining.length === 0) return;
        while ((classSlots[cls._id] || 0) > 0 && remaining.length > 0) {
          const user = remaining.shift();
          updatedSelectedClasses[user._id] = cls._id;
          classSlots[cls._id] -= 1;
        }
      });

      const allocated = pendingUsers.length - remaining.length;
      const unallocated = remaining.length;

      setAllocatedCount(allocated);
      setUnallocatedCount(unallocated);
      setRemainingPending(remaining);

      setSelectedClasses(updatedSelectedClasses);

      const allClasses = [...classesList, ...fullClassesList];
      const totalOccupied = allClasses.reduce((sum, cls) => {
        const count = Number(cls.studentCount) || 0;
        return sum + count;
      }, 0);
      const totalStudents = totalOccupied + pendingUsers.length;
      const totalClasses = allClasses.length;
      let requiredMax = maxStudentsPerClass;

      if (totalClasses > 0) {
        requiredMax = Math.ceil(totalStudents / totalClasses);
        if (requiredMax > 35) {
          requiredMax = 35;
        }
      }
      setRequiredMaxStudentsPerClass(requiredMax);

      const totalCapacity = totalClasses * requiredMax;
      const expectedUnallocated = Math.max(0, totalStudents - totalCapacity);

      setExpectedUnallocatedCount(expectedUnallocated);

      if (unallocated > 0) {
        message.warning("Vẫn còn học sinh chưa được phân bổ");
      }
    };

    allocateStudents();
  }, [pendingUsers, classesList, fullClassesList, maxStudentsPerClass]);

  // useEffect 3: Đồng bộ newClassesData với form khi modal mở
  useEffect(() => {
    if (isModalVisible) {
      form.setFieldsValue({
        newClasses: newClassesData.map((cls) => ({
          className: cls.className,
          teacherId: cls.teacherId,
        })),
      });
    } else {
      form.resetFields();
    }
  }, [isModalVisible, newClassesData, form]);

  // Hàm chọn lớp cho học sinh
  const handleClassChange = (userId, classId) => {
    setSelectedClasses((prev) => ({
      ...prev,
      [userId]: classId,
    }));
  };

  // Hàm lưu một học sinh vào lớp
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
      const userResponse = await axios.get(
        `${BASE_URL}/semester/${semester._id}/users`,
        config
      );

      dispatch(setRecentlyUpdatedUsers(userId));
      dispatch(setUsersInSmt(userResponse.data));
      message.success("Học sinh đã được thêm vào lớp thành công.");
      await fetchPendingUsers();
      setSelectedClasses((prev) => {
        const newSelected = { ...prev };
        delete newSelected[userId];
        return newSelected;
      });
    } catch (error) {
      message.error("Thêm vào lớp thất bại.");
      console.error("Error saving user:", error);
    } finally {
      setSavingUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Hàm tạo lớp mới
  const handleCreateClass = async () => {
    try {
      const values = await form.validateFields();

      if (
        !values.newClasses ||
        !Array.isArray(values.newClasses) ||
        values.newClasses.length === 0
      ) {
        throw new Error("Không có dữ liệu lớp mới để tạo.");
      }

      setLoading(true);

      const createClassPromises = values.newClasses.map((cls) =>
        axios.post(
          `${BASE_URL}/admins/create-class`,
          {
            semesterId: currentSemester._id,
            className: cls.className,
            teacherId: cls.teacherId,
            limitStudent: 30, // Giới hạn mặc định
          },
          config
        )
      );

      await Promise.all(createClassPromises);
      message.success("Tạo lớp mới thành công.");

      // Cập nhật lại danh sách lớp
      await fetchPendingUsers();
      await fetchClasses();

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message || "Có lỗi xảy ra khi tạo lớp mới.");
      console.error("Error during class creation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Hàm tính số lớp cần tạo
  const calculateClassesToCreate = (totalPending) => {
    if (totalPending === 0) return 0; // Không có học sinh nào cần xử lý

    const studentsPerClass = 30; // Số học sinh tối đa cho mỗi lớp
    const threshold = 20; // Ngưỡng tối thiểu để tạo thêm lớp

    // Tính số lớp cần tạo
    let classesToCreate = Math.floor(totalPending / studentsPerClass);
    const remainder = totalPending % studentsPerClass;

    // Nếu số dư >= ngưỡng tối thiểu, thêm 1 lớp
    if (remainder >= threshold) {
      classesToCreate += 1;
    }

    return classesToCreate;
  };

  // Hàm lưu các học sinh đã phân bổ vào backend
  const saveAllocatedStudents = async () => {
    try {
      const promises = Object.keys(selectedClasses).map((userId) =>
        axios.post(
          `${BASE_URL}/admins/assign/student`,
          {
            userId,
            classId: selectedClasses[userId],
          },
          config
        )
      );
      await Promise.all(promises);
      await fetchCurrentSemester();

      const userIds = Object.keys(selectedClasses);
      dispatch(setRecentlyUpdatedUsers(userIds));

      await fetchPendingUsers();

      setSelectedClasses({});
      message.success("Các học sinh đã được phân bổ thành công.");
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu học sinh đã phân bổ.");
      console.error("Error saving allocated students:", error);
    }
  };

  // Hàm xử lý khi nhấn "Lưu Tất Cả"
  const handleSaveAll = async () => {
    setLoading(true);
    try {
      if (unallocatedCount > 20) {
        // Hiển thị modal tạo lớp mới nếu danh sách chờ có trên 20 học sinh
        const classesToCreate = calculateClassesToCreate(unallocatedCount);
        setClassesToCreate(classesToCreate);
        setNewClassesData(
          Array.from({ length: classesToCreate }, (_, index) => ({
            key: index,
            className: `Lớp mới ${index + 1}`, // Giá trị mặc định cho tên lớp
            teacherId: null, // Giá trị mặc định cho giáo viên
          }))
        );
        setIsModalVisible(true);
      } else if (unallocatedCount > 0 && unallocatedCount <= 20) {
        // Gợi ý tăng giới hạn lớp nếu danh sách chờ nhỏ hơn hoặc bằng 20
        setNewMaxStudents(Math.min(requiredMaxStudentsPerClass, 35));
        setIsIncreaseLimitModalVisible(true);
      } else {
        // Nếu không có học sinh chờ, lưu lại toàn bộ phân bổ
        await saveAllocatedStudents();
        message.success("Tất cả học sinh đã được thêm vào lớp thành công.");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu tất cả.");
      console.error("Error saving all:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm tăng số lượng sinh viên trong lớp
  const handleUpdateMaxStudents = async () => {
    try {
      // Đảm bảo newMaxStudents không vượt quá 35
      const cappedMax = Math.min(newMaxStudents, 35);
      dispatch(setMaxStudentsPerClass(cappedMax));
      localStorage.setItem("maxStudentsPerClass", JSON.stringify(cappedMax));
      setIsIncreaseLimitModalVisible(false);
      message.success(
        `Giới hạn số học sinh tối đa cho mỗi lớp đã được cập nhật thành ${cappedMax}.`
      );

      // Phân bổ lại học sinh với giới hạn mới
      await fetchPendingUsers();
      await fetchClasses();

      // Sau khi fetch lại, useEffect 2 sẽ tự động phân bổ học sinh
      // Sau khi phân bổ, nếu vẫn còn học sinh chưa phân bổ, sẽ hiển thị cảnh báo
      // Người dùng có thể tiếp tục hành động như tăng giới hạn hoặc tạo lớp mới
    } catch (error) {
      message.error("Có lỗi xảy ra khi tăng giới hạn lớp.");
      console.error("Error increasing class limit:", error);
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
          {fullClassesList
            .filter(
              (cls) => Number(cls.studentCount) < Number(maxStudentsPerClass)
            )
            .map((cls) => (
              <Option key={cls._id} value={cls._id}>
                {cls.className}- ({cls.studentCount} người) -{" "}
                {maxStudentsPerClass - cls.studentCount} chỗ trống
              </Option>
            ))}
        </Select>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (text, record) => (
        <CustomButton
          onClick={() => handleSaveUser(record._id)}
          loading={savingUserIds.includes(record._id)}
          content={"Lưu"}
        ></CustomButton>
      ),
    },
  ];

  // Kiểm tra xem có thể tạo lớp mới hay không
  const shouldSuggestCreateClass =
    unallocatedCount >= 20 && classesList.length > 0;

  return (
    <div className="pending-users">
      {/* <h3 className="header-content-mentor-detail">
        Sinh Viên Chưa Được Thêm Vào Lớp - {currentSemester?.name}
      </h3> */}
      <div
        style={{
          minHeight: "600px",
          marginTop: 20,
          backgroundColor: "rgb(245 245 245 / 31%)",
          borderRadius: "10px",
        }}
      >
        {/* Modal tăng giới hạn lớp */}
        <Modal
          title="Tăng Giới Hạn Lớp"
          visible={isIncreaseLimitModalVisible}
          onOk={handleUpdateMaxStudents}
          onCancel={() => setIsIncreaseLimitModalVisible(false)}
          okText="Lưu"
          cancelText="Hủy"
          width={400}
        >
          <p>
            Để phân bổ thêm học sinh, bạn có thể tăng giới hạn số học sinh tối
            đa mỗi lớp. Giới hạn hiện tại là{" "}
            <strong>{maxStudentsPerClass}</strong> học sinh/lớp.
            <br />
            Đề xuất tăng lên{" "}
            <strong>
              {requiredMaxStudentsPerClass || maxStudentsPerClass}
            </strong>{" "}
            học sinh/lớp để phân bổ tất cả học sinh.
            {expectedUnallocatedCount > 0 && (
              <>
                {" "}
                Sau khi tăng, vẫn còn {expectedUnallocatedCount} học sinh chưa
                được phân bổ.
              </>
            )}
          </p>
          <Form.Item label="Giới hạn mới cho số học sinh tối đa mỗi lớp:">
            <InputNumber
              min={maxStudentsPerClass + 1}
              max={35}
              value={newMaxStudents}
              onChange={(value) => setNewMaxStudents(Math.min(value, 35))}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Modal>

        {/* Modal tạo lớp mới */}
        <Modal
          title={`Tạo ${classesToCreate} lớp mới`}
          visible={isModalVisible}
          onOk={handleCreateClass}
          onCancel={handleCancel}
          okText="Tạo Lớp"
          cancelText="Hủy"
          width={700}
          confirmLoading={loading}
        >
          <Form form={form} layout="vertical">
            {newClassesData.map((cls, index) => (
              <div
                key={cls.key}
                style={{
                  border: "1px solid #f0f0f0",
                  padding: "15px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                }}
              >
                <Title level={5}>Lớp thứ {index + 1}</Title>
                <Form.Item
                  name={["newClasses", index, "className"]}
                  label="Tên lớp"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên lớp." },
                  ]}
                >
                  <Input placeholder="Nhập tên lớp" />
                </Form.Item>
                <Form.Item
                  name={["newClasses", index, "teacherId"]}
                  label="Giáo viên phụ trách"
                  rules={[
                    { required: true, message: "Vui lòng chọn giáo viên." },
                  ]}
                >
                  <Select placeholder="Chọn giáo viên">
                    {teachersList.map((teacher) => (
                      <Option key={teacher._id} value={teacher._id}>
                        {teacher.username} - {teacher.email} -{" "}
                        {teacher.classCount} lớp
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            ))}
          </Form>
        </Modal>

        {/* Thông tin thống kê */}
        <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
          {/* Phần Thống kê */}
          <Col xs={24} sm={24} md={12}>
            <Card style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)" }}>
              <Row justify="space-around" align="middle">
                <Col
                  style={{
                    marginRight: 11,
                    borderRight: "2px inset",
                    paddingRight: 11,
                  }}
                >
                  <Statistic
                    title="Tổng số học sinh đang chờ"
                    value={pendingUsers.length}
                    precision={0}
                    valueStyle={{ color: "orange" }}
                    suffix="học sinh"
                  />
                </Col>
                <Col
                  style={{
                    marginRight: 11,
                    borderRight: "2px inset",
                    paddingRight: 11,
                  }}
                >
                  <Statistic
                    title="Số học sinh đã được gợi ý"
                    value={allocatedCount}
                    precision={0}
                    valueStyle={{ color: "#3f8600" }}
                    suffix="học sinh"
                  />
                </Col>
                <Col>
                  <Statistic
                    title="Số học sinh chưa được gán"
                    value={unallocatedCount}
                    precision={0}
                    valueStyle={{ color: "#cf1322" }}
                    suffix="học sinh"
                  />
                </Col>
              </Row>
              {unallocatedCount < 20 && unallocatedCount !== 0 && (
                <Button
                  style={{
                    backgroundColor: "#4682B4",
                    color: "#FFF",
                    marginTop: "10px",
                  }}
                  onClick={handleOpenIncreaseLimitModal}
                >
                  Tăng Giới Hạn Lớp
                </Button>
              )}
            </Card>
          </Col>

          {/* Phần Cảnh Báo */}
          <Col xs={24} sm={24} md={12}>
            {unallocatedCount > 0 && (
              <Alert
                message={
                  unallocatedCount > 20
                    ? `Có ${unallocatedCount} học sinh chưa được phân bổ. Vui lòng tạo thêm lớp mới.`
                    : `Có ${unallocatedCount} học sinh chưa được phân bổ. Bạn có thể tăng giới hạn lớp để phân bổ thêm học sinh.`
                }
                type="warning"
                showIcon
                action={
                  <Button
                    style={{ backgroundColor: "#4682B4", color: "#FFF" }}
                    onClick={handleSaveAll}
                  >
                    {unallocatedCount > 20
                      ? "Tạo Lớp Mới"
                      : "Tăng Giới Hạn Lớp"}
                  </Button>
                }
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                }}
              />
            )}
          </Col>
        </Row>

        {loadingData ? (
          <Spin
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
            }}
            tip="Đang tải dữ liệu..."
            size="large"
          />
        ) : (
          <>
            {/* Nếu không có học sinh đang chờ */}
            {pendingUsers.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "50px" }}>
                <Empty
                  description={
                    <span>
                      Không có học sinh nào đang chờ được thêm vào lớp.
                    </span>
                  }
                ></Empty>
              </div>
            ) : (
              <>
                {/* Nút "Lưu Tất Cả" */}

                <Table
                  dataSource={pendingUsers}
                  columns={columns}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                  style={{
                    marginTop: 20,
                    border: "2px solid rgb(236 236 236)",
                    minHeight: "330px",
                    marginBottom: 20,
                    borderRadius: "10px",
                  }}
                />
                <div
                  style={{
                    textAlign: "right",
                    marginBottom: "10px",
                  }}
                >
                  <CustomButton
                    onClick={handleSaveAll}
                    loading={loading}
                    content={" Lưu Tất Cả"}
                  ></CustomButton>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PendingUsers;
