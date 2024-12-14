import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Button,
  Table,
  Select,
  Tag,
  Input,
  Space,
  Modal,
  message,
} from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UserAddModal from "../semester/semesterModel/UserAddModal";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import ErrorAlerts from "../semester/ErrorAlerts";
import {
  setCounts,
  setDetailSemester,
  setLoading,
  setSemesterName,
  setSid,
  setUsersInSmt,
} from "../../redux/slice/semesterSlide";
import {
  clearRoleSelect,
  setRecentlyUpdatedUsers,
  setRoleSelect,
} from "../../redux/slice/UserSlice";
import "./UserListSemester.css";
import SemesterDetailsCard from "../semester/SemesterDetailsCard";
import UploadFileModal from "./UploadFileModal";
import "../../pages/teacher/teacherCSS/MentorSelectionOverview.css";
import SelectRoleModal from "./SelectRoleModal";
import CustomButton from "../../components/Button/Button";
const { Option } = Select;
const { Search } = Input;

const UserListSemester = () => {
  // 2 state này để đóng mở modal
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  // 2 state này để edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  console.log("selectedUser", selectedUser);

  // click vào ( bật ắt modal )
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setEditedUser(null);
    setIsEditMode(false);
    setIsUserModalVisible(true);
  };
  // handle khi ấn edit
  const toggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
      setEditedUser(null);
    } else {
      setIsEditMode(true);
      setEditedUser({ ...selectedUser });
    }
  };

  const handleSaveChanges = async () => {
    try {
      // So sánh dữ liệu đã thay đổi
      const updatedFields = {};
      for (const key in editedUser) {
        if (editedUser[key] !== selectedUser[key]) {
          updatedFields[key] = editedUser[key];
        }
      }

      // Nếu không có dữ liệu nào thay đổi, không cần gửi request
      if (Object.keys(updatedFields).length === 0) {
        message.warning("Không có thay đổi nào để cập nhật!");
        setIsEditMode(false);
        return;
      }

      // Gửi request cập nhật chỉ với các trường thay đổi
      const response = await axios.put(
        `${BASE_URL}/user/update/${selectedUser._id}`,
        updatedFields,
        config
      );

      message.success("Cập nhật thành công!");

      // Cập nhật danh sách người dùng trong state Redux
      const updatedUser = {
        ...selectedUser, // Giữ lại các trường cũ
        ...response.data, // Ghi đè các trường được cập nhật
      };

      // Cập nhật Redux state
      const updatedUsers = usersInSmt.map((user) =>
        user._id === selectedUser._id ? updatedUser : user
      );
      dispatch(setUsersInSmt(updatedUsers));
      dispatch(setRecentlyUpdatedUsers(selectedUser._id));
      fetchCurrentSemester();
      // Cập nhật thông tin người dùng hiện tại
      setSelectedUser(response.data);
      setIsUserModalVisible(false); // Đóng modal
      setIsEditMode(false); // Tắt chế độ chỉnh sửa
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error);
      message.error("Cập nhật thất bại!");
    }
  };

  const closeUserModal = () => {
    setIsEditMode(false);
    setEditedUser(null);
    setIsUserModalVisible(false);
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { sid, usersInSmt, currentSemester, semester } = useSelector(
    (state) => state.semester
  );
  const location = useLocation();
  const fromAdmin = location.state?.fromAdmin || false;
  const { selectedRole, recentlyUpdatedUsers } = useSelector(
    (state) => state.user
  );

  const [selectedClass, setSelectedClass] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 9,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isRoleSelectModalVisible, setIsRoleSelectModalVisible] =
    useState(false);
  const [selectedUploadRole, setSelectedUploadRole] = useState(null);
  const { errorMessages, fullClassUsers, failedEmails } = useSelector(
    (state) => state.error
  );
  useState(false);
  const [isSelectRoleModalVisible, setIsSelectRoleModalVisible] =
    useState(false);

  const [hasOpenedModalFromAdmin, setHasOpenedModalFromAdmin] = useState(false);

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
    { id: 4, name: "Sinh viên" },
    { id: 2, name: "Giáo viên" },
    { id: 3, name: "Người hướng dẫn" },
    { id: 5, name: "Người dùng khác" },
  ];
  useEffect(() => {
    if (fromAdmin && !hasOpenedModalFromAdmin) {
      setIsSelectRoleModalVisible(true);
      setHasOpenedModalFromAdmin(true); // Set the flag to true
    }
  }, [fromAdmin, hasOpenedModalFromAdmin]);

  const handleAddUserClick = () => {
    if (selectedRole) {
      // Nếu đã có selectedRole, mở ngay modal chọn phương thức thêm người dùng
      setIsSelectRoleModalVisible(true);
    } else {
      // Nếu chưa có selectedRole, yêu cầu chọn vai trò trước
      setIsRoleSelectModalVisible(true);
    }
  };

  const handleRoleSelectOk = () => {
    if (!selectedUploadRole) {
      message.error("Vui lòng chọn vai trò người dùng trước khi tiếp tục.");
      return;
    }
    dispatch(setRoleSelect(selectedUploadRole));
    setIsRoleSelectModalVisible(false);
    setIsSelectRoleModalVisible(true); // Mở modal chọn phương thức thêm người dùng
  };

  const handleRoleSelectCancel = () => {
    setIsRoleSelectModalVisible(false);
    setSelectedUploadRole(null);
  };

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
    dispatch(setRoleSelect(roleId));
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
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Tên",
      dataIndex: "username",
      key: "username",
      render: (text, record) => (
        <Button type="link" onClick={() => handleUserClick(record)}>
          {text}
        </Button>
      ),
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
                  to={`/admin/class-manager/class-detail/${cls.classId}`}
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
      render: (status) => {
        let color = "red";
        let text = "Không hoạt động";

        if (status === "Active") {
          color = "green";
          text = "Hoạt động";
        } else if (status === "Pending") {
          color = "orange";
          text = "Chưa có lớp";
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },

    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) =>
        roles.find((r) => r.id === role)?.name || "Không xác định",
    },
  ];

  const fetchCurrentSemester = async () => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get(`${BASE_URL}/semester/current`, config);
      const semester = response.data;

      // Cập nhật Redux state
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
    } finally {
      dispatch(setLoading(false));
    }
  };

  // useEffect(() => {
  //   if (!currentSemester) {
  //     fetchCurrentSemester();
  //   }
  // }, []);

  return (
    <div className="user-details">
      {/* đây là modal khi click vào sẽ hiển thị ra  */}
      {semester.status !== "Finished" && (
        <Modal
          title={`Thông tin ${
            selectedUser?.role === 4 ? "Sinh viên" : "Giáo viên"
          }`}
          open={isUserModalVisible}
          onCancel={closeUserModal}
          footer={[
            isEditMode ? (
              <>
                <Button key="cancel" onClick={toggleEditMode}>
                  Hủy
                </Button>
                <Button key="save" type="primary" onClick={handleSaveChanges}>
                  Lưu
                </Button>
              </>
            ) : (
              <>
                <Button key="edit" type="primary" onClick={toggleEditMode}>
                  Chỉnh sửa
                </Button>
                <Button key="close" onClick={closeUserModal}>
                  Đóng
                </Button>
              </>
            ),
          ]}
        >
          {selectedUser && (
            <div>
              <p>
                <b>Tên:</b>{" "}
                {isEditMode ? (
                  <Input
                    value={editedUser.username}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, username: e.target.value })
                    }
                  />
                ) : (
                  selectedUser.username
                )}
              </p>
              <p>
                <b>Email:</b>{" "}
                {isEditMode ? (
                  <Input
                    value={editedUser.email}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, email: e.target.value })
                    }
                  />
                ) : (
                  selectedUser.email
                )}
              </p>
              {selectedUser.role === 4 && (
                <>
                  <p>
                    <b>MSSV:</b>{" "}
                    {isEditMode ? (
                      <Input
                        value={editedUser.rollNumber || ""}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            rollNumber: e.target.value,
                          })
                        }
                      />
                    ) : (
                      selectedUser.rollNumber || "Không có"
                    )}
                  </p>
                  <p>
                    <b>Chuyên Ngành:</b>{" "}
                    {isEditMode ? (
                      <Input
                        value={editedUser.major || ""}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            major: e.target.value,
                          })
                        }
                      />
                    ) : (
                      selectedUser.major || "Không có"
                    )}
                  </p>
                </>
              )}
              {selectedUser.role === 2 && (
                <>
                  <p>
                    <b>Số điện thoại:</b>{" "}
                    {isEditMode ? (
                      <Input
                        value={editedUser.phoneNumber || ""}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            phoneNumber: e.target.value,
                          })
                        }
                      />
                    ) : (
                      selectedUser.phoneNumber || "Không có"
                    )}
                  </p>
                </>
              )}
              <p>
                <b>Trạng thái:</b>{" "}
                {isEditMode ? (
                  <Select
                    value={editedUser.status}
                    onChange={(value) =>
                      setEditedUser({ ...editedUser, status: value })
                    }
                    style={{ width: "100%" }}
                  >
                    <Select.Option value="Active">Hoạt động</Select.Option>
                    <Select.Option value="InActive">
                      Không hoạt động
                    </Select.Option>
                  </Select>
                ) : (
                  <Tag
                    color={
                      selectedUser.status === "Active"
                        ? "green"
                        : selectedUser.status === "Pending"
                        ? "orange"
                        : "red"
                    }
                  >
                    {selectedUser.status === "Active"
                      ? "Hoạt động"
                      : selectedUser.status === "Pending"
                      ? "Chưa có lớp"
                      : "Không hoạt động"}
                  </Tag>
                )}
              </p>
            </div>
          )}
        </Modal>
      )}

      <div
        style={{
          minHeight: "600px",
          backgroundColor: "rgb(245 245 245 / 31%)",
          borderRadius: "10px",
        }}
      >
        <SemesterDetailsCard />
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
                <CustomButton
                  onClick={handleAddUserClick}
                  content={"Thêm người dùng"}
                />

                {fullClassUsers.length > 0 && (
                  <Button
                    type="primary"
                    onClick={() => navigate("pending-users")}
                  >
                    Xem Sinh Viên Chưa Thêm Vào Lớp
                  </Button>
                )}
              </Space>
            </div>
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
            <SelectRoleModal
              visible={isSelectRoleModalVisible}
              onManualAdd={() => {
                setIsModalVisible(true);
                setIsSelectRoleModalVisible(false);
              }}
              onFileUpload={() => {
                setIsUploadModalVisible(true);
                setIsSelectRoleModalVisible(false);
              }}
              onCancel={() => {
                setIsSelectRoleModalVisible(false);
                dispatch(clearRoleSelect());
              }}
            />
            {/* Thêm UploadFileModal */}
            <UploadFileModal
              visible={isUploadModalVisible}
              onCancel={() => {
                setIsUploadModalVisible(false);
                dispatch(clearRoleSelect());
              }}
              semesterId={semester._id}
              refreshData={fetchCurrentSemester}
            />
            <UserAddModal
              visible={isModalVisible}
              onOk={() => {
                setIsModalVisible(false);
                dispatch(clearRoleSelect());
              }}
              onCancel={() => {
                setIsModalVisible(false);
                dispatch(clearRoleSelect());
              }}
              semesterId={semester._id}
            />
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              {roles.map((role) => (
                <Card
                  className="card-choose-user"
                  key={role.id}
                  hoverable
                  style={{
                    width: "150px",
                    marginLeft: 10,
                    textAlign: "center",
                    border: "none",
                    color: "#fff",
                    backgroundColor:
                      selectedRole === role.id ? "rgb(25 135 162)" : "#62b6cb",
                    fontWeight: "bold",
                    borderRadius: "10px",
                  }}
                  bodyStyle={{ padding: "10px" }}
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
                  style={{ width: "381px", marginBottom: "20px" }}
                  allowClear
                  enterButton
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
                  <CustomButton
                    onClick={handleAddUserClick}
                    content={"Thêm người dùng"}
                  />
                </Space>
              </div>
            </div>
            <UserAddModal
              visible={isModalVisible}
              onOk={() => {
                setIsModalVisible(false);
                dispatch(clearRoleSelect());
              }}
              onCancel={() => {
                setIsModalVisible(false);
                dispatch(clearRoleSelect());
              }}
              semesterId={semester._id}
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
            <SelectRoleModal
              visible={isSelectRoleModalVisible}
              onManualAdd={() => {
                setIsModalVisible(true);
                setIsSelectRoleModalVisible(false);
              }}
              onFileUpload={() => {
                setIsUploadModalVisible(true);
                setIsSelectRoleModalVisible(false);
              }}
              onCancel={() => {
                setIsSelectRoleModalVisible(false);
                dispatch(clearRoleSelect());
              }}
            />
            {/* Thêm UploadFileModal */}
            <UploadFileModal
              visible={isUploadModalVisible}
              onCancel={() => {
                setIsUploadModalVisible(false);
                dispatch(clearRoleSelect());
              }}
              semesterId={semester._id}
              refreshData={fetchCurrentSemester}
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
              style={{
                marginTop: 20,
                border: "2px solid rgb(236 236 236)",
                minHeight: "330px",
                marginBottom: 20,
                borderRadius: "10px",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserListSemester;
