import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Button,
  Table,
  Select,
  Tag,
  Input,
  Dropdown,
  Space,
  Menu,
  Modal,
  message,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { UploadOutlined, UserAddOutlined } from "@ant-design/icons";
import UserAddModal from "../semester/semesterModel/UserAddModal";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import ErrorAlerts from "../semester/ErrorAlerts";
import {
  setCounts,
  setCurrentSemester,
  setDetailSemester,
  setLoading,
  setSemesterName,
  setSid,
  setUsersInSmt,
} from "../../redux/slice/semesterSlide";
import EditSemesterModal from "../semester/semesterModel/EditSemesterModel";
import {
  setErrorMessages,
  setFailedEmails,
} from "../../redux/slice/ErrorSlice";
import TransferClassModal from "../semester/userModel/TransferClassModal";
import SwapClassModal from "../semester/userModel/SwapClassModal";
import { setRecentlyUpdatedUsers } from "../../redux/slice/UserSlice";
import "./UserListSemester.css";
import SemesterDetailsCard from "../semester/SemesterDetailsCard";
import UploadFileModal from "./UploadFileModal";
import "../../pages/teacher/teacherCSS/MentorSelectionOverview.css";

const { Option } = Select;
const { Search } = Input;

const UserListSemester = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { sid, usersInSmt, currentSemester, semester } = useSelector(
    (state) => state.semester
  );
  const { recentlyUpdatedUsers } = useSelector((state) => state.user);
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
  const [isUploadFileModalVisible, setIsUploadFileModalVisible] =
    useState(false); // Thêm state cho UploadFileModal

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
      setIsUploadFileModalVisible(true); // Mở UploadFileModal thay vì UploadModal cũ
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

  const filteredUsers = usersInSmt
    .filter((user) => {
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
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Sắp xếp theo updatedAt

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setSelectedUploadRole(roleId);
    setSelectedClass(null);
  };

  useEffect(() => {
    if (recentlyUpdatedUsers.length > 0) {
      const timer = setTimeout(() => {
        dispatch(setRecentlyUpdatedUsers([]));
      }, 10000); // 10 giây

      return () => clearTimeout(timer);
    }
  }, [recentlyUpdatedUsers]);

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
            render: (text, record) =>
              record.classId ? (
                // Nếu có classId thì hiển thị các hành động liên quan đến chuyển và hoán đổi lớp
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item
                        key="1"
                        onClick={() => handleTransferModal(record)}
                      >
                        Chuyển lớp
                      </Menu.Item>
                      <Menu.Item
                        key="2"
                        onClick={() => handleSwapModal(record)}
                      >
                        Hoán đổi lớp
                      </Menu.Item>
                    </Menu>
                  }
                  trigger={["click"]}
                >
                  <Button>Hành động</Button>
                </Dropdown>
              ) : (
                // Nếu không có classId thì hiển thị hành động "Thêm vào lớp"
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item
                        key="1"
                        onClick={() => navigate(`pending-users`)}
                      >
                        Thêm vào lớp{" "}
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

  return (
    <div className="user-details">
      <SemesterDetailsCard handleEditSemester={handleEditSemester} />

      <ErrorAlerts
        fullClassUsers={fullClassUsers}
        errorMessages={errorMessages}
        failedEmails={failedEmails}
        selectedRole={selectedUploadRole}
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
          {/* Thêm UploadFileModal */}
          <UploadFileModal
            visible={isUploadFileModalVisible}
            onCancel={() => setIsUploadFileModalVisible(false)}
            selectedRole={selectedUploadRole}
            setSelectedRole={setSelectedUploadRole}
            semesterId={semester._id}
            refreshData={fetchCurrentSemester}
          />
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
          {/* Loại bỏ Modal Upload cũ */}
          {/* Thêm UploadFileModal */}
          <UploadFileModal
            visible={isUploadFileModalVisible}
            onCancel={() => setIsUploadFileModalVisible(false)}
            selectedRole={selectedUploadRole}
            setSelectedRole={setSelectedUploadRole}
            semesterId={semester._id}
            refreshData={fetchCurrentSemester}
          />
          <EditSemesterModal
            visible={isEditModalVisible}
            onOk={handleEditModalOk}
            onCancel={() => setIsEditModalVisible(false)}
            semester={semester}
            apiErrors={editApiErrors}
          />
          <Table
            className="mentor-table"
            dataSource={filteredUsers}
            columns={columns}
            rowKey={(record) => record._id}
            rowClassName={(record) =>
              recentlyUpdatedUsers.includes(record._id) ? "highlight-row" : ""
            }
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
