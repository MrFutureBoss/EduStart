import { useRef, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Highlighter from "react-highlight-words";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Space, Table } from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassTaskData } from "../../redux/slice/ClassManagementSlice";

const TableClass = ({ ungroup }) => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");

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
      try {
        const response = await axios.get(
          `${BASE_URL}/class/task/${userId}`,
          config
        );
        dispatch(setClassTaskData(response.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [userId, config, dispatch]);

  const classTask = useSelector((state) => state.classManagement.classtask);
  console.log("Class Task Data:", JSON.stringify(classTask));

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Tìm lớp học`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: "block",
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          ></Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Làm mới
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({
                closeDropdown: false,
              });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Lọc theo
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            Đóng
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1677ff" : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
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
      title: "Tên lớp",
      dataIndex: "className",
      key: "className",
      width: "30%",
      ...getColumnSearchProps("className", "Tìm lớp học"),
    },
    {
      title: "Số lượng sinh viên",
      dataIndex: "totalStudentInClass",
      key: "totalStudentInClass",
      width: "30%",
      sorter: (a, b) => a.totalStudentInClass - b.totalStudentInClass,
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Số nhóm chưa đủ thành viên",
      key: "incompleteGroups",
      dataIndex: "tempGroupId",
      render: (tempGroupId) => {
        const incompleteCount = tempGroupId.filter(
          (group) => !group.status
        ).length;
        const totalGroups = tempGroupId.length;
        return (
          <div>
            {totalGroups > 0 ? (
              <p style={{ padding: "0px", margin: "0px" }}>
                <span style={{ fontWeight: "500", color: "red" }}>
                  {incompleteCount}
                </span>{" "}
                / <span style={{ fontWeight: "500" }}>{totalGroups}</span> nhóm
              </p>
            ) : (
              <p style={{ fontWeight: "500", color: "red" }}>
                Chưa có nhóm cần tạo nhóm
              </p>
            )}
          </div>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/teacher-dashboard/class/detail/${record.className}`}>
            Xem chi tiết lớp
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Dùng để Debug */}
      {/* <pre>{JSON.stringify(classTask, null, 2)}</pre> */}
      <Table
        columns={columns}
        dataSource={classTask?.data || []}
        rowKey="_id"
      />
    </div>
  );
};

export default TableClass;
