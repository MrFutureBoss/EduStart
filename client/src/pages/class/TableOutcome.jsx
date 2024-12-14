import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Space, Spin, message, Button, Input, Select, Tag } from "antd";
import Highlighter from "react-highlight-words";
import { SearchOutlined } from "@ant-design/icons";
import moment from "moment";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";

const { Option } = Select;

const TableOutcome = ({ classList, semesterId }) => {
  const [allOutcomes, setAllOutcomes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [selectedOutcomeId, setSelectedOutcomeId] = useState(null);
  const searchInput = useRef(null);
  const navigate = useNavigate();
  const [currentOutcomeId, setCurrentOutcomeId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
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
        setAllOutcomes(outcomesData);

        const outcomeNameMap = {};
        outcomesData.forEach((outcome) => {
          outcomeNameMap[outcome._id] = outcome.name;
        });

        const activitiesResponse = await axios.get(
          `${BASE_URL}/activity/user/${userId}?activityType=outcome`,
          config
        );
        const activities = Array.isArray(activitiesResponse.data)
          ? activitiesResponse.data
          : activitiesResponse.data.activities || [];

        const parsedActivities = activities.map((activity) => ({
          ...activity,
          startDate: moment(activity.startDate),
          deadline: moment(activity.deadline),
        }));
        const today = moment();

        const currentOutcomes = parsedActivities.filter(
          (activity) =>
            activity.startDate.isSameOrBefore(today, "day") &&
            activity.deadline.isSameOrAfter(today, "day")
        );

        let initialCurrentOutcomeId = null;
        if (currentOutcomes.length > 0) {
          const uniqueCurrentOutcomesMap = {};
          currentOutcomes.forEach((activity) => {
            if (!uniqueCurrentOutcomesMap[activity.outcomeId]) {
              uniqueCurrentOutcomesMap[activity.outcomeId] = activity;
            }
          });
          const uniqueCurrentOutcomes = Object.values(uniqueCurrentOutcomesMap);

          initialCurrentOutcomeId = uniqueCurrentOutcomes[0].outcomeId;
        }

        setCurrentOutcomeId(initialCurrentOutcomeId);

        if (!initialCurrentOutcomeId && outcomesData.length > 0) {
          setSelectedOutcomeId(outcomesData[0]._id);
        } else {
          setSelectedOutcomeId(initialCurrentOutcomeId);
        }

        const selectedActivities = initialCurrentOutcomeId
          ? parsedActivities.filter(
              (activity) => activity.outcomeId === initialCurrentOutcomeId
            )
          : [];

        const seenClasses = new Set();
        const tableData = selectedActivities
          .filter((activity) => {
            if (seenClasses.has(activity.classId?.className)) {
              return false;
            }
            seenClasses.add(activity.classId?.className);
            return true;
          })
          .map((activity) => {
            const groupsForClass = selectedActivities.filter(
              (a) => a.classId.className === activity.classId.className
            );

            const totalGroupsCount = groupsForClass.length;
            const assignedGroupsCount = totalGroupsCount;
            const notSubmittedCount = groupsForClass.filter(
              (group) => !group.completed
            ).length;

            return {
              key: activity._id,
              className: activity.classId?.className || "N/A",
              title: outcomeNameMap[activity.outcomeId] || "N/A",
              startDate: activity.startDate.format("YYYY-MM-DD"),
              deadline: activity.deadline.format("YYYY-MM-DD"),
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
      fetchData();
    }
  }, [semesterId]);

  const handleSelectChange = async (value) => {
    setSelectedOutcomeId(value);
    try {
      setLoading(true);
      const jwt = localStorage.getItem("jwt");
      const userId = localStorage.getItem("userId");
      const config = { headers: { Authorization: `Bearer ${jwt}` } };

      const activitiesResponse = await axios.get(
        `${BASE_URL}/activity/user/${userId}?activityType=outcome`,
        config
      );
      const activities = Array.isArray(activitiesResponse.data)
        ? activitiesResponse.data
        : activitiesResponse.data.activities || [];

      const parsedActivities = activities.map((activity) => ({
        ...activity,
        startDate: moment(activity.startDate),
        deadline: moment(activity.deadline),
      }));

      const selectedActivities = parsedActivities.filter(
        (activity) => activity.outcomeId === value
      );

      const outcomeNameMap = {};
      allOutcomes.forEach((outcome) => {
        outcomeNameMap[outcome._id] = outcome.name;
      });

      const seenClasses = new Set();
      const tableData = selectedActivities
        .filter((activity) => {
          if (seenClasses.has(activity.classId?.className)) {
            return false;
          }
          seenClasses.add(activity.classId?.className);
          return true;
        })
        .map((activity, index) => {
          const groupsForClass = selectedActivities.filter(
            (a) => a.classId.className === activity.classId.className
          );

          const totalGroupsCount = groupsForClass.length;
          const assignedGroupsCount = totalGroupsCount;
          const notSubmittedCount = groupsForClass.filter(
            (group) => !group.completed
          ).length;

          return {
            key: activity._id,
            className: activity.classId?.className || "N/A",
            title: outcomeNameMap[activity.outcomeId] || "N/A",
            startDate: activity.startDate.format("YYYY-MM-DD"),
            deadline: activity.deadline.format("YYYY-MM-DD"),
            assignedGroups: assignedGroupsCount,
            totalGroups: totalGroupsCount,
            notSubmittedCount,
          };
        });

      setFilteredData(tableData);
    } catch (error) {
      console.error("Error fetching activities for selected outcome:", error);
      message.error("Failed to fetch activities for selected outcome.");
    } finally {
      setLoading(false);
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
      title: "Loại",
      dataIndex: "title",
      key: "title",
      width: "20%",
      ...getColumnSearchProps("title"),
    },
    {
      title: "Hạn nộp",
      dataIndex: "deadline",
      key: "deadline",
      width: "15%",
      sorter: (a, b) => moment(a.deadline).unix() - moment(b.deadline).unix(),
      render: (text) => <span>{moment(text).format("DD/MM/YYYY")}</span>,
    },
    {
      title: "Nhóm chưa nộp",
      dataIndex: "notSubmittedCount",
      key: "notSubmittedCount",
      width: "20%",
      render: (notSubmittedCount, record) => {
        if (notSubmittedCount === 0) {
          return <Tag color="green">Tất cả các nhóm đã nộp</Tag>;
        } else {
          return (
            <span>
              {notSubmittedCount}/{record.totalGroups}
            </span>
          );
        }
      },
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
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginRight: "16px",
              }}
            >
              Tiến độ{" "}
              <Select
                value={selectedOutcomeId}
                onChange={handleSelectChange}
                style={{ minWidth: "200px" }}
                loading={false}
                placeholder="Chọn Outcome"
                showSearch
                onSearch={(value) => {}}
                filterOption={false}
                dropdownStyle={{ maxHeight: 200, overflow: "auto" }}
              >
                {allOutcomes.map((outcome) => {
                  const today = moment();
                  let statusColor = "gray";

                  if (
                    today.isSameOrAfter(moment(outcome.startDate), "day") &&
                    today.isSameOrBefore(moment(outcome.deadline), "day")
                  ) {
                    statusColor = "dodgerblue";
                  } else if (today.isBefore(moment(outcome.startDate), "day")) {
                    statusColor = "orange";
                  }

                  const isCurrentOutcome =
                    outcome._id === currentOutcomeId &&
                    today.isSameOrAfter(moment(outcome.startDate), "day") &&
                    today.isSameOrBefore(moment(outcome.deadline), "day");

                  return (
                    <Option key={outcome._id} value={outcome._id}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: statusColor,
                            display: "inline-block",
                            marginRight: "8px",
                          }}
                        />
                        <span>
                          {outcome.name}{" "}
                          {isCurrentOutcome && (
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "dodgerblue",
                                marginLeft: "8px",
                              }}
                            >
                              (Outcome hiện tại)
                            </span>
                          )}
                        </span>
                      </div>
                    </Option>
                  );
                })}
              </Select>
            </p>
          </div>
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
