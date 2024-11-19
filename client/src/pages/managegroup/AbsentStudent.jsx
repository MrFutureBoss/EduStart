import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  message,
  Tag,
  Input,
  Space,
  Tooltip,
  Popconfirm,
  Alert,
} from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useParams } from "react-router-dom";
import {
  setStudentInClass,
  setTotalStudentInClass,
} from "../../redux/slice/ClassManagementSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  SearchOutlined,
  StarFilled,
  StopOutlined,
  SyncOutlined,
  TableOutlined,
} from "@ant-design/icons";
import Highlighter from "react-highlight-words";

const AbsentStudent = () => {
  const jwt = localStorage.getItem("jwt");
  const dispatch = useDispatch();
  const { className } = useParams();
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(null); // Loading cho từng sinh viên
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/class/className/${className}`,
          config
        );
        const studentResponse = await axios.get(
          `${BASE_URL}/group/student/${response.data?.classId}`,
          config
        );
        dispatch(setStudentInClass(studentResponse.data?.students));
        dispatch(setTotalStudentInClass(studentResponse.data?.total));
        setFilteredStudents(studentResponse.data?.students);
      } catch (error) {
        console.error(
          error.response ? error.response.data.message : error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [config, className, dispatch]);

  const students = useSelector(
    (state) => state.classManagement.studentsInClass || []
  );

  const handleStatusChange = async (student) => {
    setLoadingStudent(student._id); // Bật loading cho sinh viên cụ thể
    const newStatus = student.status === "Active" ? "InActive" : "Active";

    try {
      // Cập nhật trạng thái của sinh viên hiện tại
      await axios.patch(
        `${BASE_URL}/user/${student._id}`,
        {
          status: newStatus,
          isLeader: newStatus === "InActive" ? false : student.isLeader,
        },
        config
      );

      let updatedStudents = [...students];

      if (newStatus === "InActive" && student.isLeader) {
        // Nếu user là leader và chuyển sang InActive
        const groupMembers = students.filter(
          (s) =>
            s.groupId?._id === student.groupId?._id &&
            s._id !== student._id &&
            s.status !== "InActive"
        );

        if (groupMembers.length > 0) {
          // Chọn ngẫu nhiên một thành viên khác để làm leader
          const randomMember =
            groupMembers[Math.floor(Math.random() * groupMembers.length)];
          await axios.patch(
            `${BASE_URL}/user/${randomMember._id}`,
            { isLeader: true },
            config
          );

          updatedStudents = updatedStudents.map((s) => {
            if (s._id === randomMember._id) {
              return { ...s, isLeader: true };
            }
            if (s._id === student._id) {
              return { ...s, isLeader: false, status: newStatus };
            }
            return s;
          });

          message.info(`Nhóm trưởng mới là: ${randomMember.username}`);
        } else {
          // Nếu không còn thành viên nào đủ điều kiện làm leader
          updatedStudents = updatedStudents.map((s) =>
            s._id === student._id
              ? { ...s, isLeader: false, status: newStatus }
              : s
          );
        }
      } else if (newStatus === "Active") {
        // Nếu user chuyển sang Active
        const groupMembers = students.filter(
          (s) => s.groupId?._id === student.groupId?._id
        );
        const allInactive = groupMembers.every((s) => s.status === "InActive");

        if (allInactive) {
          // Nếu tất cả đều InActive trước đó, đặt user này làm leader
          await axios.patch(
            `${BASE_URL}/user/${student._id}`,
            { isLeader: true },
            config
          );

          updatedStudents = updatedStudents.map((s) =>
            s._id === student._id
              ? { ...s, status: newStatus, isLeader: true }
              : s
          );
        } else {
          // Cập nhật trạng thái user bình thường nếu nhóm không toàn InActive
          updatedStudents = updatedStudents.map((s) =>
            s._id === student._id ? { ...s, status: newStatus } : s
          );
        }
      } else {
        // Cập nhật trạng thái bình thường nếu không thuộc các điều kiện đặc biệt
        updatedStudents = updatedStudents.map((s) =>
          s._id === student._id ? { ...s, status: newStatus } : s
        );
      }

      const groupMembers = students.filter(
        (s) => s.groupId?._id === student.groupId?._id
      );
      const activeCount = groupMembers.filter(
        (s) => s.status === "Active"
      ).length;
      const allInactiveExecpt = activeCount === 1;
      const allInactive = groupMembers.every((s) => s.status === "InActive");

      if (newStatus === "Active" && allInactive && student.groupId?._id) {
        // Nếu nhóm chuyển sang trạng thái Active
        await axios.patch(
          `${BASE_URL}/group/${student.groupId._id}`,
          { status: "Active" },
          config
        );

        updatedStudents = updatedStudents.map((s) => {
          if (s.groupId?._id === student.groupId?._id) {
            return {
              ...s,
              groupId: { ...s.groupId, status: "Active" }, // Cập nhật trạng thái nhóm thành Active
            };
          }
          return s;
        });

        message.success(`${student.groupId.name} đã hoạt động trở lại.`);
      } else if (
        newStatus === "InActive" &&
        allInactiveExecpt &&
        student.groupId?._id
      ) {
        // Nếu nhóm chuyển sang trạng thái InActive
        await axios.patch(
          `${BASE_URL}/group/${student.groupId._id}`,
          { status: "InActive" },
          config
        );

        updatedStudents = updatedStudents.map((s) => {
          if (s.groupId?._id === student.groupId?._id) {
            return {
              ...s,
              groupId: { ...s.groupId, status: "InActive" }, // Cập nhật trạng thái nhóm thành InActive
            };
          }
          return s;
        });

        message.warning(`${student.groupId.name} đã giải tán.`);
      }

      // Cập nhật Redux state và giao diện
      dispatch(setStudentInClass(updatedStudents));
      setFilteredStudents(updatedStudents);
      message.success(
        `Bạn đã ${
          newStatus === "Active" ? "hoàn tác đình chỉ" : "đình chỉ"
        } sinh viên ${student.username}`
      );
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi đổi trạng thái");
    } finally {
      setLoadingStudent(null); // Tắt loading
    }
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
    setSearchedColumn("");
    setFilteredStudents(students);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Tìm kiếm`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Tìm
          </button>
          <button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Làm mới
          </button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  // Cột hiển thị trong bảng
  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
      width: "5%",
    },
    {
      title: "Nhóm",
      dataIndex: "groupId",
      key: "groupId",
      width: "15%",
      defaultSortOrder: "ascend",
      filters: [
        ...Array.from(
          new Set(
            filteredStudents.map((item) => item.groupId?.name).filter(Boolean)
          )
        ).map((groupName) => ({
          text: groupName,
          value: groupName,
        })),
        { text: "Chưa có nhóm", value: "Chưa có nhóm" },
      ],
      onFilter: (value, record) => {
        if (value === "Chưa có nhóm") {
          return !record.groupId || !record.groupId.name;
        }
        return record.groupId?.name === value;
      },
      sorter: (a, b) => {
        const groupA = a.groupId?.name
          ? parseInt(a.groupId.name.match(/\d+/))
          : Infinity;
        const groupB = b.groupId?.name
          ? parseInt(b.groupId.name.match(/\d+/))
          : Infinity;
        return groupA - groupB;
      },
      render: (groupId) => {
        if (!groupId || !groupId.name) {
          return "Chưa có nhóm";
        }
        return groupId.status === "InActive" ? (
          <Tooltip style={{ cursor: "help" }} title="Nhóm đã giải tán">
            <StopOutlined /> {groupId.name}
          </Tooltip>
        ) : (
          groupId.name
        );
      },
    },
    {
      title: "Tên sinh viên",
      dataIndex: "username",
      key: "username",
      width: "20%",
      ...getColumnSearchProps("username"),
      render: (username, record) => (
        <span>
          {record.isLeader ? (
            <Tooltip style={{ cursor: "help" }} title="Nhóm trưởng">
              {username} <StarFilled style={{ color: "#FFD700" }} />
            </Tooltip>
          ) : (
            username
          )}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: "20%",
      ...getColumnSearchProps("email"),
    },
    {
      title: "Mã sinh viên",
      dataIndex: "rollNumber",
      key: "rollNumber",
      width: "15%",
      ...getColumnSearchProps("rollNumber"),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: "20%",
      render: (_, student) => (
        <Popconfirm
          title={`Bạn có chắc chắn muốn đổi trạng thái của ${student.username}?`}
          onConfirm={() => handleStatusChange(student)}
          okText="Đồng ý"
          cancelText="Hủy"
        >
          <Tag
            color={student.status === "Active" ? "green" : "volcano"}
            style={{
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <SyncOutlined
              spin={loadingStudent === student._id} // Spin khi loading
              style={{ marginRight: "8px" }}
            />
            {student.status === "Active" ? "Đang hoạt động" : "Đã dừng môn học"}
          </Tag>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Alert
        message="Hướng dẫn"
        description={
          <p className="remove-default-style-p">
            Hãy bấm vào biểu tượng&nbsp;
              <SyncOutlined style={{ fontSize: "0.8rem" }} />
              {" "}ở cột{" "}
            <Tag style={{ fontWeight: "500" }}><TableOutlined /> Trạng thái</Tag>
            để <Tag color={"volcano"} style={{ fontWeight: "500" }}>đình chỉ</Tag>hay <Tag color={"green"} style={{ fontWeight: "500" }}>hoàn tác đình chỉ</Tag>sinh viên
          </p>
        }
        type="info"
        showIcon
        style={{ marginBottom: "1rem" }}
      />
      <Table
        columns={columns}
        dataSource={filteredStudents}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 6 }}
      />
    </div>
  );
};

export default AbsentStudent;
