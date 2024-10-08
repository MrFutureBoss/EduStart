import React, { useState } from "react";
import { useSelector } from "react-redux";
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
  Progress,
  message,
  notification,
} from "antd";
import { Link } from "react-router-dom";
import {
  InboxOutlined,
  UploadOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import UserAddModal from "./UserAddModal";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";

const { Option } = Select;
const { Search } = Input;

const UserListSemester = () => {
  const { sid, usersInSmt, loading, error, semesterName } = useSelector(
    (state) => state.semester
  );
  const [selectedRole, setSelectedRole] = useState(null);
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
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("active");
  const [fileList, setFileList] = useState([]);
  const [selectedUploadRole, setSelectedUploadRole] = useState(null);
  const [duplicateEmails, setDuplicateEmails] = useState([]);
  const [fullClassUsers, setFullClassUsers] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const roles = [
    { id: 4, name: "Học sinh" },
    { id: 2, name: "Giáo viên" },
    { id: 3, name: "Mentor" },
    { id: 5, name: "Người dùng khác" },
  ];

  // Hàm mở modal chọn vai trò người dùng
  const showRoleSelectModal = () => {
    setIsRoleSelectModalVisible(true);
  };

  // Hàm xử lý khi xác nhận chọn vai trò
  const handleRoleSelectOk = () => {
    if (!selectedUploadRole) {
      message.error("Vui lòng chọn vai trò người dùng trước khi tiếp tục.");
      return;
    }
    setIsRoleSelectModalVisible(false);
    setIsUploadModalVisible(true);
  };

  // Hàm xử lý khi hủy chọn vai trò
  const handleRoleSelectCancel = () => {
    setIsRoleSelectModalVisible(false);
    setSelectedUploadRole(null);
  };

  // Hàm xử lý khi nhấn menu
  const handleMenuClick = (e) => {
    if (e.key === "1") {
      setIsModalVisible(true);
    } else if (e.key === "2") {
      // Mở modal chọn vai trò người dùng trước khi tải file
      showRoleSelectModal();
    }
  };

  const handleModalOk = (values) => {
    console.log("Thông tin người dùng:", values);
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleUploadModalCancel = () => {
    setIsUploadModalVisible(false);
    setUploadPercent(0);
    setUploadStatus("active");
    setFileList([]);
    setSelectedUploadRole(null);
    setDuplicateEmails([]);
    setFullClassUsers([]);
    setSuccessCount(0);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="1" icon={<UserAddOutlined />}>
        Thêm người dùng thủ công
      </Menu.Item>
      <Menu.Item key="2" icon={<UploadOutlined />}>
        Tải file
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
    setSelectedUploadRole(roleId); // Cập nhật vai trò cho upload
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
  ];

  if (!sid) {
    return <p>Vui lòng chọn một kỳ học từ danh sách bên trái.</p>;
  }

  if (loading) {
    return <p>Đang tải dữ liệu...</p>;
  }

  if (error) {
    return <p>Lỗi: {error}</p>;
  }

  const uploadProps = {
    customRequest: async (options) => {
      const { file, onSuccess, onError, onProgress } = options;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("role", selectedUploadRole);
      formData.append("semesterId", sid);

      try {
        const response = await axios.post(
          `${BASE_URL}/admins/import-users`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: ({ total, loaded }) => {
              const percent = Math.round((loaded / total) * 100);
              setUploadPercent(percent);
              onProgress({ percent }, file);
            },
          }
        );
        console.log("Response data:", response.data);

        onSuccess(response.data, file);

        // Xử lý dữ liệu phản hồi
        const {
          successCount,
          duplicateEmails,
          fullClassUsers,
          message: serverMessage,
        } = response.data;
        setDuplicateEmails(duplicateEmails);
        setFullClassUsers(fullClassUsers);
        setSuccessCount(successCount);

        // Hiển thị thông báo phù hợp dựa trên kết quả
        if (
          successCount > 0 &&
          duplicateEmails.length === 0 &&
          fullClassUsers.length === 0
        ) {
          // Tất cả người dùng được thêm thành công
          notification.success({
            message: "Upload thành công",
            description: `${successCount} người dùng đã được thêm thành công.`,
          });
        } else if (
          successCount > 0 &&
          (duplicateEmails.length > 0 || fullClassUsers.length > 0)
        ) {
          // Một số người dùng được thêm thành công, một số có lỗi
          notification.warning({
            message: "Upload thành công với một số lỗi",
            description: `${successCount} người dùng đã được thêm thành công. Có ${duplicateEmails.length} email trùng và ${fullClassUsers.length} người dùng không thể thêm do lớp đã đầy.`,
          });
        } else if (
          successCount === 0 &&
          (duplicateEmails.length > 0 || fullClassUsers.length > 0)
        ) {
          // Không có người dùng nào được thêm thành công và có lỗi
          notification.error({
            message: "Upload thất bại",
            description: `Không thêm được người dùng nào. Có ${duplicateEmails.length} email trùng và ${fullClassUsers.length} người dùng không thể thêm do lớp đã đầy.`,
          });
        }
      } catch (error) {
        onError(error);
        notification.error({
          message: "Upload thất bại",
          description: error.response?.data || error.message,
        });
      }
    },
    onRemove: () => {
      setFileList([]);
      setUploadPercent(0);
      setUploadStatus("active");
    },
    fileList,
    showUploadList: true,
  };

  return (
    <div className="user-details">
      <h2 style={{ marginBottom: 18 }}>Chi tiết kỳ học: {semesterName}</h2>
      {usersInSmt.length === 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          {/* <Dragger {...draggerProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kỳ học chưa có dữ liệu!</p>
            <p className="ant-upload-hint">
              Ấn vào để lựa chọn file cho việc thêm người dùng
            </p>
          </Dragger> */}
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
            open={isModalVisible}
            onOk={handleModalOk}
            onCancel={handleModalCancel}
          />
          {/* Modal chọn vai trò người dùng */}
          <Modal
            title="Chọn loại người dùng"
            visible={isRoleSelectModalVisible}
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
          {/* Modal tải file */}
          {/* Modal tải file */}
          <Modal
            title="Tải file"
            visible={isUploadModalVisible}
            footer={null}
            onCancel={handleUploadModalCancel}
          >
            <Upload
              {...uploadProps}
              onChange={({ file, fileList, event }) => {
                setFileList(fileList);

                if (file.status === "done") {
                  setUploadStatus("success");
                  setTimeout(() => {
                    setIsUploadModalVisible(false);
                    setUploadPercent(0);
                    setFileList([]);
                  }, 1000);
                }

                if (file.status === "error") {
                  setUploadStatus("exception");
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
            {uploadPercent > 0 && (
              <Progress percent={uploadPercent} status={uploadStatus} />
            )}

            {/* Hiển thị danh sách email trùng lặp và người dùng không thêm được */}
            {duplicateEmails.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <strong>Email đã tồn tại:</strong>
                <ul>
                  {duplicateEmails.map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
            {fullClassUsers.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <strong>Không thể thêm vì lớp đã đầy:</strong>
                <ul>
                  {fullClassUsers.map((user) => (
                    <li key={user.email}>
                      {user.username} ({user.email})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {successCount > 0 && (
              <div style={{ marginTop: "20px" }}>
                <strong>Thành công:</strong>
                <p>{successCount} người dùng đã được thêm thành công.</p>
              </div>
            )}
          </Modal>

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
