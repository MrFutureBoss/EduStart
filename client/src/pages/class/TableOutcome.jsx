import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Space, Spin, message, Button, Input, Tooltip } from "antd";
import Highlighter from "react-highlight-words";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import moment from "moment";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";

const TableOutcome = ({ classList, semesterId }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const navigate = useNavigate();
  const [currentOutcomeType, setCurrentOutcomeType] = useState("");

  useEffect(() => {
    const fetchOutcomesData = async () => {
      try {
        setLoading(true);
        const jwt = localStorage.getItem("jwt");
        const userId = localStorage.getItem("userId");
        const config = { headers: { Authorization: `Bearer ${jwt}` } };

        const outcomesResponse = await axios.get(
          `${BASE_URL}/activity/outcome-type/semester/${semesterId}`,
          config
        );

        const outcomesData = outcomesResponse.data;
        const outcomeNameMap = {};

        outcomesData.forEach((outcome) => {
          outcomeNameMap[outcome._id] = outcome.name;
        });

        const response = await axios.get(
          `${BASE_URL}/activity/user/${userId}?activityType=outcome`,
          config
        );

        const activities = Array.isArray(response.data)
          ? response.data
          : response.data.activities || [];

        const parsedActivities = activities.map((outcome) => ({
          ...outcome,
          startDate: moment(outcome.startDate),
          deadline: moment(outcome.deadline),
        }));
        const today = moment();

        const currentOutcomes = parsedActivities.filter(
          (outcome) =>
            outcome.startDate.isSameOrBefore(today) &&
            outcome.deadline.isSameOrAfter(today)
        );
        if (currentOutcomes.length > 0) {
          setCurrentOutcomeType(
            outcomeNameMap[currentOutcomes[0].outcomeId] || ""
          );
        }
        const seenClasses = new Set();
        const tableData = currentOutcomes
          .filter((outcome) => {
            if (seenClasses.has(outcome.classId?.className)) {
              return false;
            }
            seenClasses.add(outcome.classId?.className);
            return true;
          })
          .map((outcome) => {
            const groupsForClass = currentOutcomes.filter(
              (o) => o.classId.className === outcome.classId.className
            );

            const totalGroupsCount = groupsForClass.length;
            const assignedGroupsCount = totalGroupsCount;
            const notSubmittedCount = groupsForClass.filter(
              (group) => !group.completed
            ).length;

            return {
              key: outcome._id,
              className: outcome.classId?.className || "N/A",
              title: outcomeNameMap[outcome.outcomeId] || "N/A",
              startDate: outcome.startDate.format("YYYY-MM-DD"),
              deadline: outcome.deadline.format("YYYY-MM-DD"),
              assignedGroups: assignedGroupsCount,
              totalGroups: totalGroupsCount,
              notSubmittedCount,
            };
          });
        setFilteredData(tableData);
      } catch (error) {
        console.error("Error fetching or processing data:", error);
        message.error("Failed to fetch outcome data.");
      } finally {
        setLoading(false);
      }
    };

    if (semesterId) {
      fetchOutcomesData();
    }
  }, [semesterId]);

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
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
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
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
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
      key: "stt",
      render: (_, __, index) => index + 1,
      width: "3%",
    },
    {
      title: "Tên lớp",
      dataIndex: "className",
      key: "className",
      width: "17%",
      ...getColumnSearchProps("className"),
    },
    {
      title: "Loại",
      dataIndex: "title",
      key: "title",
      width: "15%",
      ...getColumnSearchProps("title"),
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      width: "13%",
      sorter: (a, b) => moment(a.startDate).unix() - moment(b.startDate).unix(),
      render: (text) => moment(text).format("DD/MM/YYYY"),
    },
    {
      title: "Hạn nộp",
      dataIndex: "deadline",
      key: "deadline",
      width: "11%",
      sorter: (a, b) => moment(a.deadline).unix() - moment(b.deadline).unix(),
      render: (text) => <span>{moment(text).format("DD/MM/YYYY")}</span>,
    },
    {
      title: "Nhóm đã giao",
      dataIndex: "assignedGroups",
      key: "assignedGroups",
      width: "13%",
      render: (assignedGroups, record) => (
        <span>
          {assignedGroups}/{record.totalGroups}
        </span>
      ),
    },
    {
      title: "Nhóm chưa nộp",
      dataIndex: "notSubmittedCount",
      key: "notSubmittedCount",
      width: "15%",
      render: (notSubmittedCount, record) => (
        <span>
          {notSubmittedCount}/{record.totalGroups}
        </span>
      ),
    },
  ];

  const handleRowClick = (record) => {
    navigate(`/teacher/class/detail/${record.className}/outcomes`);
  };

  return (
    <div>
      {loading ? (
        <Spin size="large" tip="Loading data..." />
      ) : (
        <>
          <p style={{ fontSize: "15px", fontWeight: "600" }}>
            Tiến độ {currentOutcomeType}
          </p>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="key"
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: "pointer" },
            })}
            pagination={{ pageSize: 5 }}
            locale={{
              emptyText: "Chưa có lớp nào được giao Outcome. Giao outcome",
            }}
          />
        </>
      )}
    </div>
  );
};

export default TableOutcome;
