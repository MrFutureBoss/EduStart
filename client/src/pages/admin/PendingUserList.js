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
  Badge,
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

  const [unallocatedStudentsExist, setUnallocatedStudentsExist] =
    useState(false);

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
  const handleOpenIncreaseLimitModal = () => {
    setIsIncreaseLimitModalVisible(true);
    setNewMaxStudents(maxStudentsPerClass);
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

      // Tạo đối tượng lưu số slot còn lại cho các lớp
      const classSlots = {};

      // Xử lý lớp chưa đầy: Sử dụng remainingSlots từ API
      availableClassesResponse.data.classes.forEach((cls) => {
        let remainingSlots = cls.remainingSlots;
        if (maxStudentsPerClass > cls.limitStudent) {
          remainingSlots += maxStudentsPerClass - cls.limitStudent; // Cộng thêm slot nếu maxStudentsPerClass lớn hơn limit
        }
        classSlots[cls._id] = remainingSlots;
      });

      // Xử lý lớp đã đầy: Tính remainingSlots dựa trên maxStudentsPerClass và studentCount
      fullClassesResponse.data.classes.forEach((cls) => {
        const extraSlots = maxStudentsPerClass - cls.studentCount;
        classSlots[cls._id] = extraSlots > 0 ? extraSlots : 0; // Nếu có extraSlots, cập nhật remainingSlots
      });

      // Sắp xếp các lớp theo thứ tự ưu tiên: lớp chưa đầy trước, lớp đầy sau
      const sortedClasses = [
        ...availableClassesResponse.data.classes.map((cls) => ({
          ...cls,
          source: "available",
        })),
        ...fullClassesResponse.data.classes.map((cls) => ({
          ...cls,
          source: "full",
        })),
      ].sort((a, b) => {
        const aRemainingSlots = classSlots[a._id];
        const bRemainingSlots = classSlots[b._id];
        return bRemainingSlots - aRemainingSlots; // Ưu tiên lớp có nhiều chỗ trống hơn
      });

      // Phân bổ học sinh vào các lớp theo số slot còn lại
      const initialSelectedClasses = {};
      let classIndex = 0;

      usersResponse.data.pendingUsers.forEach((user) => {
        while (classIndex < sortedClasses.length) {
          const cls = sortedClasses[classIndex];
          if (classSlots[cls._id] > 0) {
            initialSelectedClasses[user._id] = cls._id;
            classSlots[cls._id] -= 1; // Giảm số lượng slot còn lại
            break;
          } else {
            classIndex += 1;
          }
        }

        if (classIndex >= sortedClasses.length) {
          initialSelectedClasses[user._id] = null;
        }
      });

      setSelectedClasses(initialSelectedClasses);

      if (Object.values(initialSelectedClasses).includes(null)) {
        message.warning("Vẫn còn học sinh chưa được phân bổ");
        setUnallocatedStudentsExist(true);
      } else {
        setUnallocatedStudentsExist(false);
      }
    } catch (error) {
      message.error("Lỗi khi lấy danh sách học sinh hoặc lớp.");
      console.error("Error fetching pending users:", error);
    } finally {
      setLoadingData(false);
    }
  }, [currentSemester?._id, config, dispatch, maxStudentsPerClass]);

  // Fetch danh sách lớp
  const fetchClasses = useCallback(async () => {
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

  // Hàm tăng số lượng sinh viên trong lớp
  const handleUpdateMaxStudents = () => {
    dispatch(setMaxStudentsPerClass(newMaxStudents));
    localStorage.setItem("maxStudentsPerClass", JSON.stringify(newMaxStudents));
    setIsIncreaseLimitModalVisible(false);
    message.success(
      `Giới hạn số học sinh tối đa cho mỗi lớp đã được cập nhật thành ${newMaxStudents}.`
    );
  };

  const handleClassChange = (userId, classId) => {
    setSelectedClasses((prev) => ({
      ...prev,
      [userId]: classId,
    }));
  };

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
      // Lấy dữ liệu từ form
      const values = await form.validateFields();
      setLoading(true);

      // Thực hiện tạo lớp với promises
      const createClassPromises = values.newClasses.map((cls) =>
        axios.post(
          `${BASE_URL}/admins/create-class`,
          {
            semesterId: currentSemester._id,
            className: cls.className,
            teacherId: cls.teacherId,
            limitStudent: 30,
          },
          config
        )
      );

      // Chờ tất cả các lớp mới được tạo thành công
      await Promise.all(createClassPromises);
      message.success("Tạo lớp mới thành công.");

      // Sau khi tạo lớp mới, lấy danh sách lớp cập nhật
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

      // Cập nhật Redux store
      dispatch(setClassesList(availableClassesResponse.data.classes));
      dispatch(setFullClassesList(fullClassesResponse.data.classes));

      // Đóng modal và reset form
      setIsModalVisible(false);
      form.resetFields();

      // Lấy lại danh sách học sinh đang chờ và phân bổ
      await fetchPendingUsers();

      // Gọi allocateStudents với dữ liệu lớp mới
      await allocateStudents(
        availableClassesResponse.data.classes,
        fullClassesResponse.data.classes
      );
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const errorMessage = error.response.data.message;
        const fieldName = error.response.data.field;

        form.setFields([
          {
            name: ["newClasses", 0, fieldName],
            errors: [errorMessage],
          },
        ]);
      } else {
        message.error("Tạo lớp mới thất bại.");
        console.error("Error during class creation:", error);
      }
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
    let classesToCreate = 0;
    let remainder = 0;

    if (totalPending >= 40) {
      classesToCreate = Math.floor(totalPending / 30);
      remainder = totalPending % 30;

      if (remainder >= 20) {
        classesToCreate += 1;
      }
      // Nếu remainder < 20, không tạo thêm lớp mới
    }

    return classesToCreate;
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const totalPending = pendingUsers.length;
      const totalAvailableSlots = classesList.reduce(
        (acc, cls) => acc + (maxStudentsPerClass - cls.studentCount),
        0
      );

      // Số học sinh còn lại sau khi phân bổ vào các lớp hiện có
      const studentsRemaining = totalPending - totalAvailableSlots;

      let classesToCreate = 0;

      if (studentsRemaining > 0) {
        // Sử dụng hàm calculateClassesToCreate để tính toán số lớp cần tạo
        classesToCreate = calculateClassesToCreate(studentsRemaining);
      }

      if (classesToCreate > 0) {
        setClassesToCreate(classesToCreate);
        setNewClassesData(
          Array.from({ length: classesToCreate }, (_, i) => ({
            key: i,
            className: "",
            teacherId: null,
          }))
        );
        setIsModalVisible(true);
        return; // Chờ admin nhập thông tin lớp mới
      }

      // Nếu tất cả học sinh có thể được phân bổ, tiến hành phân bổ và lưu
      await allocateStudents(classesList, fullClassesList);
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu tất cả.");
      console.error("Error saving all:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm phân bổ học sinh
  const allocateStudents = async (availableClasses, fullClasses) => {
    try {
      const updatedSelectedClasses = { ...selectedClasses };
      let remainingPending = [...pendingUsers];

      // 1. Khởi tạo availableSlots mapping
      const availableSlots = {};

      // Xử lý lớp chưa đầy: Sử dụng remainingSlots từ API và thêm nếu maxStudentsPerClass tăng
      availableClasses.forEach((cls) => {
        let remainingSlots = cls.remainingSlots;
        if (maxStudentsPerClass > cls.limitStudent) {
          remainingSlots += maxStudentsPerClass - cls.limitStudent; // Cộng thêm slot nếu maxStudentsPerClass lớn hơn limit
        }
        availableSlots[cls._id] = remainingSlots;
      });

      // Xử lý lớp đã đầy: Tính extraSlots dựa trên maxStudentsPerClass và studentCount
      fullClasses.forEach((cls) => {
        const extraSlots = maxStudentsPerClass - cls.studentCount;
        availableSlots[cls._id] = extraSlots > 0 ? extraSlots : 0; // Nếu có extraSlots, cập nhật remainingSlots
      });

      // 2. Phân bổ vào các lớp chưa đầy trước
      const sortedAvailableClasses = [...availableClasses].sort(
        (a, b) => b.remainingSlots - a.remainingSlots
      );

      for (let cls of sortedAvailableClasses) {
        if (remainingPending.length === 0) break;
        const available = availableSlots[cls._id];
        if (available > 0) {
          const toAssign = Math.min(available, remainingPending.length);
          const usersToAssign = remainingPending.splice(0, toAssign);
          usersToAssign.forEach((user) => {
            updatedSelectedClasses[user._id] = cls._id;
          });
          availableSlots[cls._id] -= toAssign;
        }
      }

      // 3. Phân bổ vào các lớp đầy nếu vẫn còn học sinh chưa được phân bổ
      if (remainingPending.length > 0) {
        const sortedFullClasses = [...fullClasses].sort(
          (a, b) => (availableSlots[b._id] || 0) - (availableSlots[a._id] || 0)
        );
        for (let cls of sortedFullClasses) {
          if (remainingPending.length === 0) break;
          const available = availableSlots[cls._id];
          if (available > 0) {
            const toAssign = Math.min(available, remainingPending.length);
            const usersToAssign = remainingPending.splice(0, toAssign);
            usersToAssign.forEach((user) => {
              updatedSelectedClasses[user._id] = cls._id;
            });
            availableSlots[cls._id] -= toAssign;
          }
        }
      }

      // 4. Kiểm tra lại nếu vẫn còn học sinh chưa được phân bổ
      if (remainingPending.length > 0) {
        setUnallocatedStudentsExist(true);
        return;
      } else {
        setUnallocatedStudentsExist(false);
      }

      // 5. Cập nhật state
      setSelectedClasses(updatedSelectedClasses);
      // 6. Lưu phân bổ vào backend
      const promises = Object.keys(updatedSelectedClasses).map((userId) =>
        axios.post(
          `${BASE_URL}/admins/assign/student`,
          {
            userId,
            classId: updatedSelectedClasses[userId],
          },
          config
        )
      );
      await Promise.all(promises);
      await fetchCurrentSemester();

      const userIds = Object.keys(updatedSelectedClasses);
      dispatch(setRecentlyUpdatedUsers(userIds));

      message.success("Tất cả học sinh đã được thêm vào lớp thành công.");
      // Cập nhật danh sách học sinh đang chờ
      dispatch(setPendingUsers([]));
      await fetchPendingUsers();
    } catch (error) {
      message.error("Có lỗi xảy ra khi phân bổ học sinh.");
      console.error("Error allocating students:", error);
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
            .filter((cls) => cls.studentCount < maxStudentsPerClass)
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
        <Button
          style={{ backgroundColor: "#4682B4", color: "#FFF" }}
          onClick={() => handleSaveUser(record._id)}
          loading={savingUserIds.includes(record._id)}
        >
          Lưu
        </Button>
      ),
    },
  ];

  // Kiểm tra xem có thể tạo lớp mới hay không
  const canCreateClass = pendingUsers.length >= 20;
  const shouldSuggestCreateClass =
    pendingUsers.length >= 20 && classesList.length === 0;

  return (
    <div className="pending-users" style={{ padding: "20px" }}>
      <Title style={{ marginBottom: 20 }} level={2}>
        Sinh Viên Chưa Được Thêm Vào Lớp - {currentSemester?.name}
      </Title>

      <Modal
        title="Tăng Giới Hạn hoặc Tạo Lớp Mới"
        visible={isIncreaseLimitModalVisible}
        onOk={handleUpdateMaxStudents}
        onCancel={() => setIsIncreaseLimitModalVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form.Item label="Giới hạn mới cho số học sinh tối đa mỗi lớp:">
          <InputNumber
            min={30}
            max={40}
            value={newMaxStudents}
            onChange={setNewMaxStudents}
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Modal>
      {/* Hiển thị số lượng học sinh đang chờ */}
      <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
        {/* Statistic Section */}
        <Col xs={24} sm={24} md={10}>
          <Card>
            <Statistic
              title="Tổng số học sinh đang chờ"
              value={pendingUsers.length}
              precision={0}
              valueStyle={{ color: "#3f8600" }}
              suffix="học sinh"
            />
            {unallocatedStudentsExist && (
              <Button
                style={{
                  backgroundColor: "#4682B4",
                  color: "#FFF",
                  float: "right",
                }}
                onClick={handleOpenIncreaseLimitModal}
              >
                Tăng Giới Hạn Lớp
              </Button>
            )}
          </Card>
        </Col>

        {/* Alert Section */}
        <Col xs={24} sm={24} md={14}>
          {shouldSuggestCreateClass && (
            <Alert
              message={`Có ${pendingUsers.length} học sinh đang chờ và không có lớp khả dụng. Vui lòng tạo lớp mới.`}
              type="warning"
              showIcon
              action={
                <Button
                  style={{ backgroundColor: "#4682B4", color: "#FFF" }}
                  onClick={handleSaveAll}
                >
                  Tạo Lớp Mới
                </Button>
              }
              style={{ height: "100%", display: "flex", alignItems: "center" }}
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
                  <span>Không có học sinh nào đang chờ được thêm vào lớp.</span>
                }
              ></Empty>
            </div>
          ) : (
            <>
              {/* Nút "Lưu Tất Cả" nếu có thể tạo lớp mới */}

              <div
                style={{
                  textAlign: "right",
                  marginBottom: "10px",
                  marginTop: "40px",
                }}
              >
                <Button
                  style={{ backgroundColor: "#4682B4", color: "#FFF" }}
                  onClick={handleSaveAll}
                  loading={loading}
                >
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
        </>
      )}

      {/* Modal tạo lớp mới */}
      <Modal
        title={`Tạo ${classesToCreate} lớp mới`}
        open={isModalVisible}
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
                rules={[{ required: true, message: "Vui lòng nhập tên lớp." }]}
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
                      {teacher.username} - {teacher.email}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default PendingUsers;
