import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Button,
  Table,
  Select,
  Tag,
  Input,
  Upload,
  Dropdown,
  Space,
  Menu,
  Modal,
  message,
  notification,
  Descriptions,
  Badge,
  Typography,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  UploadOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import UserAddModal from "./semesterModel/UserAddModal";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import ErrorAlerts from "./ErrorAlerts";
import {
  setCounts,
  setCurrentSemester,
  setLoading,
  setSemesterName,
  setSid,
  setUsersInSmt,
} from "../../redux/slice/semesterSlide";
import EditSemesterModal from "./semesterModel/EditSemesterModel";
import {
  setErrorMessages,
  setFailedEmails,
  setFullClassUsers,
} from "../../redux/slice/ErrorSlice";
import TransferClassModal from "./userModel/TransferClassModal";
import SwapClassModal from "./userModel/SwapClassModal";

const { Option } = Select;
const { Search } = Input;
const { Title } = Typography;

const UserListSemester = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    sid,
    usersInSmt,
    semesterName,
    currentSemester,
    classCount,
    mentorCount,
    teacherCount,
    studentCount,
    endDate,
    startDate,
    status,
    semester,
  } = useSelector((state) => state.semester);

  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 9,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isRoleSelectModalVisible, setIsRoleSelectModalVisible] =
    useState(false);
  const [selectedUploadRole, setSelectedUploadRole] = useState(null);
  const [successCount, setSuccessCount] = useState(0);
  const { errorMessages, fullClassUsers, failedEmails } = useSelector(
    (state) => state.error
  );
  const [editApiErrors, setEditApiErrors] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const [isSwapModalVisible, setIsSwapModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const jwt = localStorage.getItem("jwt");

  const config = {
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
  };
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const roles = [
    { id: 4, name: "Học sinh" },
    { id: 2, name: "Giáo viên" },
    { id: 3, name: "Mentor" },
    { id: 5, name: "Người dùng khác" },
  ];

  const showRoleSelectModal = (isManual) => {
    setIsManualEntry(isManual);
    setIsRoleSelectModalVisible(true);
  };

  const handleRoleSelectOk = () => {
    if (!selectedUploadRole) {
      message.error("Vui lòng chọn vai trò người dùng trước khi tiếp tục.");
      return;
    }
    setIsRoleSelectModalVisible(false);
    if (isManualEntry) {
      setIsModalVisible(true);
    } else {
      setIsUploadModalVisible(true);
    }
  };

  const handleTransferModal = (student) => {
    setSelectedStudent(student);
    setIsTransferModalVisible(true);
  };

  const handleSwapModal = (student) => {
    setSelectedStudent(student);
    setIsSwapModalVisible(true);
  };

  const closeTransferModal = () => {
    setIsTransferModalVisible(false);
    setSelectedStudent(null);
  };

  const closeSwapModal = () => {
    setIsSwapModalVisible(false);
    setSelectedStudent(null);
  };
  const handleRoleSelectCancel = () => {
    setIsRoleSelectModalVisible(false);
    setSelectedUploadRole(null);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleUploadModalCancel = () => {
    setIsUploadModalVisible(false);
    setSelectedUploadRole(null);
    setSuccessCount(0);
    setErrorMessages([]);
    setFailedEmails([]);
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={() => showRoleSelectModal(true)}>
        <UserAddOutlined /> Thêm người dùng thủ công
      </Menu.Item>
      <Menu.Item key="2" onClick={() => showRoleSelectModal(false)}>
        <UploadOutlined /> Tải file
      </Menu.Item>
    </Menu>
  );

  const filteredUsers = usersInSmt.filter((user) => {
    if (selectedRole && user.role !== selectedRole) {
      return false;
    }
    if (
      selectedRole === 4 &&
      selectedClass &&
      user.classId?.className !== selectedClass
    ) {
      return false;
    }
    if (
      searchText &&
      !(
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phoneNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.rollNumber?.toLowerCase().includes(searchText.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setSelectedUploadRole(roleId);
    setSelectedClass(null);
  };

  const classOptions = [
    ...new Set(
      usersInSmt
        .filter((user) => user.role === 4)
        .map((user) => user.classId?.className)
    ),
  ];

  const columns = [
    {
      title: "Tên",
      dataIndex: "username",
      key: "username",
      render: (text, record) => <Link to={`/user/${record._id}`}>{text}</Link>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    ...(selectedRole === 4
      ? [
          {
            title: "MSSV",
            dataIndex: "rollNumber",
            key: "rollNumber",
          },
          {
            title: "Lớp học",
            dataIndex: "classId",
            key: "classId",
            render: (classId) => classId?.className || "Không xác định",
          },
        ]
      : selectedRole === 2
      ? [
          {
            title: "Số điện thoại",
            dataIndex: "phoneNumber",
            key: "phoneNumber",
          },
          {
            title: "Các lớp đang dạy",
            dataIndex: "classesTeaching",
            key: "classesTeaching",
            render: (classes) =>
              classes.map((cls) => (
                <Link
                  key={cls.classId}
                  to={`/class/${cls.classId}`}
                  style={{ display: "block" }}
                >
                  {cls.className}
                </Link>
              )),
          },
        ]
      : selectedRole === 3
      ? [
          {
            title: "Số điện thoại",
            dataIndex: "phoneNumber",
            key: "phoneNumber",
          },
          {
            title: "Lĩnh vực",
            dataIndex: "mentorCategoryInfo",
            key: "field",
            render: (mentorCategoryInfo) =>
              mentorCategoryInfo?.profession || "Không xác định",
          },
          {
            title: "Chuyên môn",
            dataIndex: "mentorCategoryInfo",
            key: "specialty",
            render: (mentorCategoryInfo) =>
              mentorCategoryInfo?.specialties || "Không xác định",
          },
        ]
      : []),
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) =>
        roles.find((r) => r.id === role)?.name || "Không xác định",
    },
    ...(selectedRole === 4
      ? [
          {
            title: "Hành động",
            key: "action",
            render: (text, record) => (
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item
                      key="1"
                      onClick={() => handleTransferModal(record)}
                    >
                      Chuyển lớp
                    </Menu.Item>
                    <Menu.Item key="2" onClick={() => handleSwapModal(record)}>
                      Hoán đổi lớp
                    </Menu.Item>
                  </Menu>
                }
                trigger={["click"]}
              >
                <Button>Hành động</Button>
              </Dropdown>
            ),
          },
        ]
      : []),
  ];

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

  useEffect(() => {
    if (!currentSemester) {
      fetchCurrentSemester();
    }
  }, [sid, dispatch, navigate]);

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
  const handleEditSemester = () => {
    setIsEditModalVisible(true);
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

  const uploadProps = {
    customRequest: async (options) => {
      const { file, onSuccess, onError, onProgress } = options;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("role", selectedUploadRole);
      formData.append("semesterId", semester?._id);

      try {
        const response = await axios.post(
          `${BASE_URL}/admins/import-users`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              authorization: `Bearer ${jwt}`,
            },
            onUploadProgress: ({ total, loaded }) => {
              const percent = Math.round((loaded / total) * 100);
              onProgress({ percent }, file);
            },
          }
        );
        fetchCurrentSemester();
        if (response.status !== 200 || !response.data.success) {
          throw new Error(
            response.data.message || "Đã xảy ra lỗi khi upload file"
          );
        }

        const {
          successCount,
          duplicateEmails,
          fullClassUsers,
          errorMessages,
          failedEmails,
        } = response.data;
        dispatch(setErrorMessages(errorMessages));
        // Cập nhật các trạng thái lỗi
        dispatch(setFullClassUsers(fullClassUsers));
        dispatch(setFailedEmails(failedEmails));

        if (successCount > 0) {
          notification.success({
            message: "Upload thành công",
            description: `${successCount} người dùng đã được thêm thành công.`,
            duration: 5,
          });
        }

        if (
          duplicateEmails.length > 0 ||
          fullClassUsers.length > 0 ||
          errorMessages.length > 0 ||
          failedEmails.length > 0
        ) {
          notification.warning({
            message: "Có một số lỗi",
            description: `${successCount} người dùng được thêm thành công. Có ${duplicateEmails.length} email trùng, ${fullClassUsers.length} người dùng không thể thêm do lớp đã đầy, và ${errorMessages.length} lỗi khác.`,
            duration: 10,
          });
        }

        onSuccess(response.data, file);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi không xác định.";
        onError(error);
        notification.error({
          message: "Upload thất bại",
          description: errorMessage,
          duration: 10,
        });

        if (error.response?.data?.errorMessages) {
          setErrorMessages(error.response.data.errorMessages);
        }
        if (error.response?.data?.failedEmails) {
          setFailedEmails(error.response.data.failedEmails);
        }
      }
    },
  };

  return (
    <div className="user-details">
      <div style={{ marginBottom: 20 }}>
        <Card
          style={{
            marginBottom: 20,
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#f9f9f9",
            margin: "auto",
          }}
        >
          {semester.status === "Ongoing" && (
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
                handleEditSemester();
              }}
            ></Button>
          )}

          <Descriptions
            bordered
            style={{ marginTop: -10 }}
            size="small"
            title={
              <Title style={{ marginBottom: 2 }} level={3}>
                Thông tin chi tiết kỳ học
              </Title>
            }
            layout="horizontal"
            column={4}
          >
            <Descriptions.Item label={<strong>Tên kỳ học</strong>} span={1}>
              <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
                {semesterName}
              </Title>
            </Descriptions.Item>

            <Descriptions.Item label={<strong>Trạng thái</strong>}>
              {status === "Ongoing" && (
                <Badge
                  status="processing"
                  text={
                    <span style={{ fontWeight: 500, color: "#1890ff" }}>
                      Đang diễn ra
                    </span>
                  }
                />
              )}
              {status === "Finished" && (
                <Badge
                  status="default"
                  text={
                    <span style={{ fontWeight: 500, color: "#8c8c8c" }}>
                      Đã kết thúc
                    </span>
                  }
                  icon={<CheckCircleOutlined />}
                />
              )}
              {status === "Upcoming" && (
                <Badge
                  status="warning"
                  text={
                    <span style={{ fontWeight: 500, color: "#faad14" }}>
                      Sắp diễn ra
                    </span>
                  }
                  icon={<ClockCircleOutlined />}
                />
              )}
            </Descriptions.Item>

            <Descriptions.Item label={<strong>Ngày bắt đầu</strong>}>
              {new Date(startDate).toLocaleDateString("vi-VN")}
            </Descriptions.Item>

            <Descriptions.Item label={<strong>Ngày kết thúc</strong>}>
              {new Date(endDate).toLocaleDateString("vi-VN")}
            </Descriptions.Item>

            <Descriptions.Item label={<strong>Học sinh</strong>}>
              {studentCount}
            </Descriptions.Item>
            <Descriptions.Item label={<strong>Giáo viên</strong>}>
              {teacherCount}
            </Descriptions.Item>
            <Descriptions.Item label={<strong>Người hướng dẫn</strong>}>
              {mentorCount}
            </Descriptions.Item>
            <Descriptions.Item label={<strong>Số lớp học</strong>}>
              {classCount}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>

      <ErrorAlerts
        fullClassUsers={fullClassUsers}
        errorMessages={errorMessages}
        failedEmails={failedEmails}
      />

      {usersInSmt.length === 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <div
            style={{
              marginTop: "15px",
            }}
          >
            <p>Kỳ học chưa có dữ liệu!</p>
            <Space>
              <Dropdown overlay={menu} trigger={["click"]}>
                <Button>
                  <Space>Thêm người dùng</Space>
                </Button>
              </Dropdown>
              {fullClassUsers.length > 0 && (
                <Button
                  type="primary"
                  onClick={() => navigate("pending-users")}
                >
                  Xem Học Sinh Chưa Thêm Vào Lớp
                </Button>
              )}
            </Space>
          </div>
          <Modal
            title="Chọn loại người dùng"
            open={isRoleSelectModalVisible}
            onOk={handleRoleSelectOk}
            onCancel={() => setIsRoleSelectModalVisible(false)}
            okText="Tiếp tục"
            cancelText="Hủy"
          >
            <Select
              placeholder="Chọn vai trò người dùng"
              style={{ width: "100%", marginTop: 10 }}
              onChange={(value) => setSelectedUploadRole(value)}
              value={selectedUploadRole}
            >
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Modal>
          <UserAddModal
            visible={isModalVisible}
            role={selectedUploadRole}
            semesterId={semester._id}
            onOk={handleModalCancel}
            onCancel={handleModalCancel}
          />
          <Modal
            title="Tải file"
            open={isUploadModalVisible}
            footer={null}
            onCancel={handleUploadModalCancel}
          >
            <Upload
              {...uploadProps}
              onChange={({ file, fileList, event }) => {
                if (file.status === "done") {
                  setTimeout(() => {
                    setIsUploadModalVisible(false);
                  }, 1000);
                }

                if (file.status === "error") {
                }
              }}
            >
              <Button
                icon={<UploadOutlined />}
                style={{ marginBottom: "20px" }}
              >
                Chọn file để tải lên
              </Button>
            </Upload>
          </Modal>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              gap: "80px",
              marginBottom: "25px",
            }}
          >
            {roles.map((role) => (
              <Card
                key={role.id}
                hoverable
                style={{
                  width: "150px",
                  marginTop: 10,
                  textAlign: "center",
                  borderColor: selectedRole === role.id ? "blue" : "#f0f0f0",
                }}
                bodyStyle={{ padding: 20 }}
                onClick={() => handleRoleSelect(role.id)}
              >
                {role.name}
              </Card>
            ))}
          </div>
          <div>
            <div
              style={{
                float: "left",
                marginBottom: "-5px",
                marginTop: "15px",
              }}
            >
              <Search
                placeholder="Tìm theo tên, email, số điện thoại"
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: "260px", marginBottom: "20px" }}
                allowClear
              />

              {selectedRole === 4 && (
                <Select
                  placeholder="Chọn lớp học"
                  style={{
                    width: "150px",
                    marginBottom: "20px",
                    marginLeft: 10,
                  }}
                  onChange={(value) => setSelectedClass(value)}
                  allowClear
                >
                  {classOptions.map((className) => (
                    <Option key={className} value={className}>
                      {className}
                    </Option>
                  ))}
                </Select>
              )}
            </div>
            <div
              style={{
                float: "right",
                marginBottom: "-5px",
                marginTop: "15px",
              }}
            >
              <Space>
                <Dropdown overlay={menu} trigger={["click"]}>
                  <Button>
                    <Space>Thêm người dùng</Space>
                  </Button>
                </Dropdown>
              </Space>
            </div>
          </div>
          <UserAddModal
            visible={isModalVisible}
            role={selectedUploadRole}
            semesterId={semester._id}
            onOk={handleModalCancel}
            onCancel={handleModalCancel}
          />
          <TransferClassModal
            visible={isTransferModalVisible}
            onCancel={closeTransferModal}
            student={selectedStudent}
            refreshData={fetchCurrentSemester}
            currentSemester={currentSemester}
          />
          <SwapClassModal
            visible={isSwapModalVisible}
            onCancel={closeSwapModal}
            student={selectedStudent}
            refreshData={fetchCurrentSemester}
          />
          <Modal
            title="Chọn loại người dùng"
            open={isRoleSelectModalVisible}
            onOk={handleRoleSelectOk}
            onCancel={handleRoleSelectCancel}
            okText="Tiếp tục"
            cancelText="Hủy"
          >
            <Select
              placeholder="Chọn vai trò người dùng"
              style={{ width: "100%", marginTop: 10 }}
              onChange={(value) => setSelectedUploadRole(value)}
              value={selectedUploadRole}
            >
              {roles
                .filter((role) => [2, 3, 4].includes(role.id))
                .map((role) => (
                  <Option key={role.id} value={role.id}>
                    {role.name}
                  </Option>
                ))}
            </Select>
          </Modal>
          <Modal
            title="Tải file"
            open={isUploadModalVisible}
            onCancel={handleUploadModalCancel}
            footer={null}
          >
            <Upload
              {...uploadProps}
              onChange={({ file, fileList, event }) => {
                if (file.status === "done") {
                  setTimeout(() => {
                    setIsUploadModalVisible(false);
                  }, 1000);
                }

                if (file.status === "error") {
                }
              }}
            >
              <Button
                icon={<UploadOutlined />}
                style={{ marginBottom: "20px" }}
              >
                Chọn file để tải lên
              </Button>
            </Upload>
            {successCount > 0 && (
              <div style={{ marginTop: "20px" }}>
                <strong>Thành công:</strong>
                <p>{successCount} người dùng đã được thêm thành công.</p>
              </div>
            )}
          </Modal>
          <EditSemesterModal
            open={isEditModalVisible}
            onOk={handleEditModalOk}
            onCancel={() => setIsEditModalVisible(false)}
            semester={semester}
            apiErrors={editApiErrors}
          />
          <Table
            dataSource={filteredUsers}
            columns={columns}
            rowKey={(record) => record._id}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["5", "9", "20", "50"],
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
              },
            }}
            onChange={handleTableChange}
          />
        </div>
      )}
    </div>
  );
};

export default UserListSemester;
