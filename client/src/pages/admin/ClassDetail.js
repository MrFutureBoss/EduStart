import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Card,
  Table,
  Row,
  Col,
  Spin,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Dropdown,
  Menu,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  DownOutlined,
  PlusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { BASE_URL } from "../../utilities/initalValue";
import axios from "axios";
import CustomButton from "../../components/Button/Button";
import Search from "antd/es/input/Search";
import TransferClassModal from "../semester/userModel/TransferClassModal";
import SwapClassModal from "../semester/userModel/SwapClassModal";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsChangeSemester,
  setSemester,
} from "../../redux/slice/semesterSlide";

const { Header, Content } = Layout;
const { Option } = Select;

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [transferModalVisible, setTransferModalVisible] = useState(false); // Modal chuyển lớp
  const [swapModalVisible, setSwapModalVisible] = useState(false); // Modal hoán đổi lớp
  const [selectedStudent, setSelectedStudent] = useState(null); // Học sinh được chọn để xử lý
  const { currentSemester, semester, sid, isChangeSemester } = useSelector(
    (state) => state.semester
  );
  const dispatch = useDispatch();

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

  // Fetch class details
  const fetchClassDetails = async () => {
    try {
      const response = await axios(
        `${BASE_URL}/class/class-detail/${id}`,
        config
      );
      setClassData(response.data);
    } catch (error) {
      console.error("Error fetching class details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchCurrentSemesters = async () => {
    {
      try {
        const semester = await axios.get(
          `${BASE_URL}/semester/current`,
          config
        );
        const response = await axios(
          `${BASE_URL}/admins/teachers-list/${semester.data?._id}`,
          config
        );
        setTeachers(response.data.teachers || []);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    }
  };

  // // Fetch teachers list
  // const fetchTeachers = async () => {
  //   try {
  //     const response = await axios(
  //       `${BASE_URL}/admins/teachers-list/${semester?._id}`,
  //       config
  //     );
  //     setTeachers(response.data.teachers || []);
  //   } catch (error) {
  //     console.error("Error fetching teachers:", error);
  //   }
  // };

  // Open modal and set initial form values
  const handleEdit = () => {
    form.setFieldsValue({
      className: classData.className,
      teacherId: classData.teacherId?._id,
    });
    setIsChanged(false); // Reset change state
    setIsEditing(true);
  };

  // Handle form changes and check for modifications
  const handleValuesChange = (changedValues, allValues) => {
    const isModified = Object.keys(classData).some((key) =>
      key === "teacherId" || key === "className"
        ? classData[key] !== allValues[key]
        : false
    );
    setIsChanged(isModified);
  };

  // Update class information
  const handleUpdateClass = async (values) => {
    try {
      await axios.put(`${BASE_URL}/class/update-class/${id}`, values, config);
      message.success("Cập nhật lớp học thành công!");
      setIsEditing(false);
      fetchClassDetails(); // Refresh data
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.errors
      ) {
        form.setFields([
          {
            name: "className",
            errors: [
              error.response.data.errors.className || "Lỗi không xác định",
            ],
          },
        ]);
      } else {
        message.error("Cập nhật lớp học thất bại!");
      }
    }
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase()); // Convert to lowercase for case-insensitive search
  };

  const filteredStudents = useMemo(() => {
    if (!classData?.students) return [];
    return classData.students.filter(
      (student) =>
        student.rollNumber?.toLowerCase().includes(searchText) ||
        student.username?.toLowerCase().includes(searchText) ||
        student.email?.toLowerCase().includes(searchText)
    );
  }, [classData?.students, searchText]);

  useEffect(() => {
    fetchClassDetails();
    // fetchTeachers();
    handleFetchCurrentSemesters();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!classData) {
    return <div>Error loading class data.</div>;
  }

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "MSSV",
      dataIndex: "rollNumber",
      key: "rollNumber",
    },
    {
      title: "Họ tên",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Chuyên ngành",
      dataIndex: "major",
      key: "major",
    },

    ...(semester.status !== "Finished"
      ? [
          {
            title: "Hành động",
            key: "actions",
            render: (text, record) => {
              const menu = (
                <Menu>
                  <Menu.Item
                    key="transfer"
                    onClick={() => {
                      setSelectedStudent(record);
                      setTransferModalVisible(true); // Hiển thị modal chuyển lớp
                    }}
                  >
                    Chuyển lớp
                  </Menu.Item>
                  <Menu.Item
                    key="swap"
                    onClick={() => {
                      setSelectedStudent(record);
                      setSwapModalVisible(true); // Hiển thị modal hoán đổi lớp
                    }}
                  >
                    Hoán đổi lớp
                  </Menu.Item>
                </Menu>
              );

              return (
                <Dropdown overlay={menu} trigger={["click"]}>
                  <Button
                    style={{ marginLeft: "17px" }}
                    icon={<PlusCircleOutlined />}
                  />
                </Dropdown>
              );
            },
          },
        ]
      : []), // Nếu kỳ học đã kết thúc, không thêm cột "Hành động"
  ];

  return (
    <Layout>
      <Header
        style={{
          background: "#fff",
          padding: "16px",
          display: "flex",
          justifyContent: "space-between",
          borderRadius: 15,
        }}
      >
        <Button
          style={{ margin: "5px 0 0 0" }}
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          {" "}
          Quay lại
        </Button>
        <Search
          placeholder="Tìm kiếm theo MSSV, Họ tên hoặc Email"
          onChange={handleSearch}
          style={{ width: 400, marginTop: 5 }}
        />
        <h4 style={{ margin: "5px 0 0 0" }}>
          Chi tiết lớp học: {classData.className}
        </h4>
      </Header>
      <Content style={{ marginTop: "24px" }}>
        <Row gutter={16}>
          <Col span={19}>
            <Card
              className="class-manager-card"
              title="Danh sách sinh viên trong lớp"
            >
              <Table
                dataSource={filteredStudents}
                columns={columns}
                rowKey="_id"
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card
              className="class-manager-card"
              title="Thông tin lớp "
              extra={
                <Tooltip title="Chỉnh sửa thông tin">
                  {semester.status !== "Finished" && (
                    <Button
                      style={{
                        width: 25,
                        height: 25,
                        margin: " 5px 0",
                      }}
                      onClick={handleEdit}
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          color="#000000"
                          fill="none"
                        >
                          <path
                            d="M14.0737 3.88545C14.8189 3.07808 15.1915 2.6744 15.5874 2.43893C16.5427 1.87076 17.7191 1.85309 18.6904 2.39232C19.0929 2.6158 19.4769 3.00812 20.245 3.79276C21.0131 4.5774 21.3972 4.96972 21.6159 5.38093C22.1438 6.37312 22.1265 7.57479 21.5703 8.5507C21.3398 8.95516 20.9446 9.33578 20.1543 10.097L10.7506 19.1543C9.25288 20.5969 8.504 21.3182 7.56806 21.6837C6.63212 22.0493 5.6032 22.0224 3.54536 21.9686L3.26538 21.9613C2.63891 21.9449 2.32567 21.9367 2.14359 21.73C1.9615 21.5234 1.98636 21.2043 2.03608 20.5662L2.06308 20.2197C2.20301 18.4235 2.27297 17.5255 2.62371 16.7182C2.97444 15.9109 3.57944 15.2555 4.78943 13.9445L14.0737 3.88545Z"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M13 4L20 11"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M14 22L22 22"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      }
                    />
                  )}
                </Tooltip>
              }
            >
              <p>
                <b>Giáo viên phụ trách:</b> {classData.teacherId?.username}
              </p>
              <p>
                <b>Email:</b> {classData.teacherId?.email}
              </p>
              <p>
                <b>Số sinh viên:</b> {classData.students?.length}/
                {classData.limitStudent}
              </p>
            </Card>
          </Col>
        </Row>
      </Content>

      <Modal
        title="Chỉnh sửa thông tin lớp"
        visible={isEditing}
        onCancel={() => setIsEditing(false)}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: !isChanged }}
        cancelText="Hủy"
        okText="Xác nhận"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateClass}
          onValuesChange={handleValuesChange}
        >
          <Form.Item
            name="className"
            label="Tên lớp học"
            rules={[{ required: true, message: "Vui lòng nhập tên lớp học" }]}
          >
            <Input placeholder="Tên lớp học" />
          </Form.Item>
          <Form.Item
            name="teacherId"
            label="Giáo viên phụ trách"
            rules={[{ required: true, message: "Vui lòng chọn giáo viên" }]}
          >
            <Select placeholder="Chọn giáo viên">
              {teachers.map((teacher) => (
                <Option key={teacher._id} value={teacher._id}>
                  {teacher.username} - ({teacher.classCount}) lớp
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      {classData && (
        <TransferClassModal
          visible={transferModalVisible}
          onCancel={() => setTransferModalVisible(false)}
          student={selectedStudent}
          refreshData={fetchClassDetails}
          currentSemester={currentSemester}
          requestId={null}
          isHander={true}
        />
      )}

      <SwapClassModal
        visible={swapModalVisible}
        onCancel={() => setSwapModalVisible(false)}
        student={selectedStudent}
        refreshData={fetchClassDetails}
      />
    </Layout>
  );
};

export default ClassDetail;
