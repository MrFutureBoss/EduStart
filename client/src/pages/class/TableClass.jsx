import { useRef, useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Highlighter from "react-highlight-words";
import { EyeFilled, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Space, Table, Tag, Spin } from "antd"; // Import Spin
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassTaskData } from "../../redux/slice/ClassManagementSlice";
import { MdGroups } from "react-icons/md";

const TableClass = ({ ungroup, emptygroup }) => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [filteredData, setFilteredData] = useState([]); // State to hold filtered data
  const [loading, setLoading] = useState(true); // State to track loading
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
      setLoading(true); // Bắt đầu loading
      try {
        const response = await axios.get(
          `${BASE_URL}/class/task/${userId}`,
          config
        );
        dispatch(setClassTaskData(response.data));

        if (!ungroup && !emptygroup) {
          setFilteredData(response.data.data);
          return;
        }

        const filteredClasses = response.data.data.filter((item) => {
          const incompleteGroups = item.tempGroupId.filter(
            (group) => !group.status
          ).length;
          const hasNoGroups = item.tempGroupId.length === 0;

          if (ungroup && incompleteGroups > 0) {
            return true;
          }
          if (emptygroup && hasNoGroups) {
            return true;
          }
          return false;
        });

        setFilteredData(filteredClasses);
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      } finally {
        setLoading(false); // Kết thúc loading
      }
    };

    fetchUserData();
  }, [userId, config, dispatch, ungroup, emptygroup]);

  const classTask = useSelector((state) => state.classManagement.classtask);

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
          >
            Tìm
          </Button>
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
      title: "STT",
      key: "stt",
      render: (_, __, index) => index + 1,
      width: "5%",
    },
    {
      title: "Tên lớp",
      dataIndex: "className",
      key: "className",
      width: "20%",
      ...getColumnSearchProps("className"),
    },
    {
      title: "Số lượng sinh viên",
      dataIndex: "totalStudentInClass",
      key: "totalStudentInClass",
      width: "20%",
      sorter: (a, b) => a.totalStudentInClass - b.totalStudentInClass,
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Số nhóm",
      key: "totalGroups",
      dataIndex: "tempGroupId",
      width: "10%",
      render: (tempGroupId) => {
        const totalGroups = tempGroupId.length;
        return (
          <p style={{ padding: "0px", margin: "0px" }}>
            <span
              style={{
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
              }}
            >
              {totalGroups}&nbsp; <MdGroups style={{ fontSize: "1.4rem" }} />
            </span>
          </p>
        );
      },
    },
    // {
    //   title: "Vấn đề cần giải quyết",
    //   dataIndex: "tempGroupId",
    //   key: "issues",
    //   render: (tempGroupId) => {
    //     const incompleteCount = tempGroupId.filter(
    //       (group) => !group.status
    //     ).length;
    //     const totalGroups = tempGroupId.length;

    //     return (
    //       <div>
    //         {totalGroups === 0 ? (
    //           <Tag color="red">Chưa có nhóm cần tạo nhóm</Tag>
    //         ) : incompleteCount > 0 ? (
    //           <Tag color="orange">
    //             {incompleteCount} nhóm chưa chốt đủ thành viên
    //           </Tag>
    //         ) : (
    //           <Tag color="green">Hiện tại chưa có</Tag>
    //         )}
    //       </div>
    //     );
    //   },
    //   width: "15%",
    // },
    {
      title: "Hành động",
      key: "action",
      width: "20%",
      render: (_, record) => (
        <Link
          to={`/teacher/class/detail/${record.className}`}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Chi tiết lớp
        </Link>
      ),
    },
  ];

  return (
    <div>
      {loading ? ( // Kiểm tra trạng thái loading
        <Spin size="large" tip="Đang tải dữ liệu..." /> // Hiển thị Spinner
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData} // Use filtered data
          rowKey="_id"
        />
      )}
    </div>
  );
};

export default TableClass;
