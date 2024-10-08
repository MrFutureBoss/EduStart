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
} from "antd";
import { Link } from "react-router-dom";
import {
  InboxOutlined,
  UploadOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import UserAddModal from "./UserAddModal";
import Dragger from "antd/es/upload/Dragger";

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
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("active"); // Trạng thái upload
  const [fileList, setFileList] = useState([]); // Theo dõi danh sách tệp

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const roles = [
    { id: 4, name: "Học sinh" },
    { id: 2, name: "Giáo viên" },
    { id: 3, name: "Mentor" },
    { id: 5, name: "Người dùng khác" },
  ];

  const draggerProps = {
    name: "file",
    multiple: true,
    action: "https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload",
    onChange(info) {
      const { status } = info.file;
      if (status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const props = {
    action: "https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload",
    onChange({ file, fileList, event }) {
      setFileList(fileList);

      if (file.status === "uploading" && !isUploadModalVisible) {
        setIsUploadModalVisible(true);
      }

      if (event) {
        setUploadPercent(Math.round((event.loaded / event.total) * 100));
      }

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
    },
    onRemove: () => {
      setTimeout(() => {
        if (fileList.length === 1) {
          setUploadPercent(0);
          setUploadStatus("active");
          setIsUploadModalVisible(false);
        }
      }, 0);
    },
    showUploadList: true,
  };

  const handleMenuClick = (e) => {
    if (e.key === "1") {
      setIsModalVisible(true);
    } else if (e.key === "2") {
      setIsUploadModalVisible(true);
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
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="1" icon={<UserAddOutlined />}>
        Thêm người dùng thủ công
      </Menu.Item>
      <Menu.Item key="2" icon={<UploadOutlined />}>
        <Upload {...props} fileList={fileList} showUploadList={true}>
          Tải file
        </Upload>
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
        user.phoneNumber?.toLowerCase().includes(searchText.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
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
          <Dragger {...draggerProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kỳ học chưa có dự liệu!</p>
            <p className="ant-upload-hint">
              Ấn vào để lựa chọn file cho việc thêm người dùng
            </p>
          </Dragger>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              gap: "134px",
              marginBottom: "25px",
              justifyContent: "center",
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
              style={{ float: "left", marginBottom: "-5px", marginTop: "15px" }}
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
            onOk={handleModalOk}
            onCancel={handleModalCancel}
          />
          {/* Modal hiển thị tiến trình tải file */}
          <Modal
            title=" Tải file"
            visible={isUploadModalVisible}
            footer={null}
            onCancel={handleUploadModalCancel}
          >
            <Upload {...props} fileList={fileList}>
              <Button icon={<UploadOutlined />}>Chọn file để tải lên</Button>
            </Upload>
            {uploadPercent > 0 && (
              <Progress percent={uploadPercent} status={uploadStatus} />
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
