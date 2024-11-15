import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Highlighter from "react-highlight-words";
import { SearchOutlined, StarFilled } from "@ant-design/icons";
import { Button, Input, Space, Table, Tag, Spin, Tooltip } from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import {
  setStudentInClass,
  setTotalStudentInClass,
} from "../../redux/slice/ClassManagementSlice";

const StudentList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const { className } = useParams();
  const [classId, setClassId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
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
        setClassId(response.data?.classId);

        const studentResponse = await axios.get(
          `${BASE_URL}/group/student/${response.data?.classId}`,
          config
        );
        dispatch(setStudentInClass(studentResponse.data?.students));
        dispatch(setTotalStudentInClass(studentResponse.data?.total));
        setFilteredData(studentResponse.data?.students);
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
  const totalStudent = useSelector(
    (state) => state.classManagement.totalStudentInClass || 0
  );

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
    setSearchedColumn("");
    setFilteredData(students);
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
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Tìm
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Làm mới
          </Button>
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
            filteredData.map((item) => item.groupId?.name).filter(Boolean)
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
      render: (groupId) =>
        groupId && groupId.name ? groupId.name : "Chưa có nhóm",
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
      title: "Chuyên ngành",
      dataIndex: "major",
      key: "major",
      width: "20%",
      filters: [
        { text: "Kỹ thuật phần mềm", value: "Kỹ thuật phần mềm" },
        { text: "Ngôn ngữ Nhật", value: "Ngôn ngữ Nhật" },
        { text: "Kinh tế", value: "Kinh tế" },
        {
          text: "Truyền thông đa phương tiện",
          value: "Truyền thông đa phương tiện",
        },
      ],
      onFilter: (value, record) => record.major === value,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: "25%",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "volcano"}>
          {status === "Active" ? "Đang hoạt động" : "Đã dừng môn học"}
        </Tag>
      ),
    },
    // {
    //   title: "Vai trò",
    //   dataIndex: "isLeader",
    //   key: "isLeader",
    //   width: "15%",
    //   render: (isLeader) => (isLeader ? "Nhóm trưởng" : "Thành viên"),
    // },
  ];

  return (
    <div>
      <h6>Sĩ số lớp: {totalStudent} sinh viên</h6>
      {loading ? (
        <Spin size="large" tip="Đang tải dữ liệu..." />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record._id}
          pagination={{ pageSize: 6 }}
        />
      )}
    </div>
  );
};

export default StudentList;
