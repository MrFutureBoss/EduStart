import React, { useEffect, useState } from "react";
import {
  Tabs,
  Select,
  List,
  Card,
  Spin,
  Dropdown,
  Menu,
  Pagination,
  Layout,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  setActivities,
  setLoading,
  setError,
} from "../../redux/slice/ActivitySlice";
import { BASE_URL } from "../../utilities/initalValue";

const { Option } = Select;

const Tasks = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");

  const { activities, loading } = useSelector((state) => state.activities);
  const [classList, setClassList] = useState([]);
  const [selectedClass, setSelectedClass] = useState("all");
  const [currentTab, setCurrentTab] = useState("1");
  const [filterTime, setFilterTime] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  };

  useEffect(() => {
    const fetchClasses = async () => {
      dispatch(setLoading(true));
      try {
        const response = await axios.get(
          `${BASE_URL}/class/${userId}/user`,
          config
        );
        setClassList(response.data);
        dispatch(setLoading(false));
      } catch (error) {
        dispatch(setError("Error fetching classes"));
        dispatch(setLoading(false));
      }
    };

    fetchClasses();
  }, [userId, jwt, dispatch]);

  useEffect(() => {
    const fetchActivities = async () => {
      dispatch(setLoading(true));
      try {
        let url = `${BASE_URL}/activity`;
        const params = {};

        if (selectedClass !== "all") {
          params.classId = selectedClass;
        } else {
          params.teacherId = userId;
        }

        const response = await axios.get(url, { params, ...config });

        dispatch(setActivities(response.data));
        dispatch(setLoading(false));
      } catch (error) {
        dispatch(setError("Error fetching activities"));
        dispatch(setLoading(false));
      }
    };

    fetchActivities();
  }, [selectedClass, dispatch, userId]);

  const handleClassChange = (value) => {
    setSelectedClass(value);
    setCurrentPage(1);
  };

  const handleTabChange = (key) => {
    setCurrentTab(key);
    setFilterTime(null);
  };

  const handleFilterTimeChange = ({ key }) => {
    setFilterTime(key);
    setCurrentPage(1);
  };

  const filterAssignments = () => {
    let filtered = activities.filter(
      (activity) => activity.activityType === "assignment"
    );

    if (filterTime) {
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(now.getDate() - 14);

      filtered = filtered.filter((assignment) => {
        const deadline = new Date(assignment.deadline);

        if (filterTime === "thisWeek") {
          return deadline >= oneWeekAgo && deadline <= now;
        } else if (filterTime === "lastWeek") {
          return deadline >= twoWeeksAgo && deadline < oneWeekAgo;
        } else if (filterTime === "finishedEarly") {
          return (
            assignment.completedDate &&
            new Date(assignment.completedDate) < new Date(assignment.deadline)
          );
        } else if (filterTime === "later") {
          return deadline < twoWeeksAgo;
        }
        return true;
      });
    }

    if (currentTab === "2") {
      filtered = filtered.filter((assignment) => !assignment.isSubmitted);
    } else if (currentTab === "3") {
      filtered = filtered.filter((assignment) => assignment.isSubmitted);
    }

    return filtered;
  };

  const assignments = filterAssignments();

  const totalAssignments = assignments.length;
  const paginatedAssignments = assignments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Menu thời gian cho lọc
  const timeFilterMenuItems =
    currentTab === "2"
      ? [
          { key: "thisWeek", label: "Tuần này" },
          { key: "lastWeek", label: "Tuần trước" },
        ]
      : currentTab === "3"
      ? [
          { key: "finishedEarly", label: "Hoàn thành sớm" },
          { key: "thisWeek", label: "Tuần này" },
          { key: "lastWeek", label: "Tuần trước" },
          { key: "later", label: "Muộn hơn" },
        ]
      : [];

  const timeFilterMenu = {
    items: timeFilterMenuItems,
    onClick: handleFilterTimeChange,
  };

  // Cấu trúc items mới cho Tabs
  const tabItems = [
    {
      key: "1",
      label: "Đã giao",
      children: (
        <>
          <List
            itemLayout="vertical"
            dataSource={paginatedAssignments}
            renderItem={(assignment) => (
              <List.Item key={assignment._id}>
                <Card
                  title={assignment.assignmentType.toUpperCase()}
                  bordered={false}
                >
                  <p>{assignment.description}</p>
                  <p style={{ color: "red" }}>
                    <strong>Hạn chót:</strong>{" "}
                    {new Date(assignment.deadline).toLocaleDateString()}
                  </p>
                </Card>
              </List.Item>
            )}
          />
          {totalAssignments > pageSize && (
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalAssignments}
              onChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      ),
    },
    {
      key: "2",
      label: "Quá hạn",
      children: (
        <>
          <Dropdown menu={timeFilterMenu}>
            <a
              className="ant-dropdown-link"
              onClick={(e) => e.preventDefault()}
            >
              {filterTime
                ? filterTime === "thisWeek"
                  ? "Tuần này"
                  : "Tuần trước"
                : "Chọn thời gian"}
            </a>
          </Dropdown>

          <List
            itemLayout="vertical"
            dataSource={paginatedAssignments}
            renderItem={(assignment) => (
              <List.Item key={assignment._id}>
                <Card
                  title={assignment.assignmentType.toUpperCase()}
                  bordered={false}
                >
                  <p>{assignment.description}</p>
                  <p style={{ color: "red" }}>
                    <strong>Hạn chót:</strong>{" "}
                    {new Date(assignment.deadline).toLocaleDateString()}
                  </p>
                </Card>
              </List.Item>
            )}
          />
          {totalAssignments > pageSize && (
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalAssignments}
              onChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      ),
    },
    {
      key: "3",
      label: "Xong",
      children: (
        <>
          <Dropdown menu={timeFilterMenu}>
            <a
              className="ant-dropdown-link"
              onClick={(e) => e.preventDefault()}
            >
              {filterTime
                ? filterTime === "finishedEarly"
                  ? "Hoàn thành sớm"
                  : filterTime === "thisWeek"
                  ? "Tuần này"
                  : filterTime === "lastWeek"
                  ? "Tuần trước"
                  : "Muộn hơn"
                : "Chọn thời gian"}
            </a>
          </Dropdown>

          <List
            itemLayout="vertical"
            dataSource={paginatedAssignments}
            renderItem={(assignment) => (
              <List.Item key={assignment._id}>
                <Card
                  title={assignment.assignmentType.toUpperCase()}
                  bordered={false}
                >
                  <p>{assignment.description}</p>
                  <p style={{ color: "red" }}>
                    <strong>Hạn chót:</strong>{" "}
                    {new Date(assignment.deadline).toLocaleDateString()}
                  </p>
                </Card>
              </List.Item>
            )}
          />
          {totalAssignments > pageSize && (
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalAssignments}
              onChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      ),
    },
  ];

  return (
      <Layout>
        <div style={{ marginLeft: "2%", width: "90%" }}>
          <h1>Việc cần làm</h1>

          {loading ? (
            <Spin tip="Loading..." style={{ width: "100%" }}>
              <div style={{ minHeight: "200px" }}></div>
            </Spin>
          ) : (
            <>
              <Select
                style={{ width: 200, marginBottom: "24px" }}
                placeholder="Chọn lớp học"
                onChange={handleClassChange}
                value={selectedClass}
              >
                <Option value="all">Tất cả các lớp</Option>
                {classList.map((classItem) => (
                  <Option key={classItem._id} value={classItem._id}>
                    {classItem.className}
                  </Option>
                ))}
              </Select>

              <Tabs
                activeKey={currentTab}
                onChange={handleTabChange}
                items={tabItems}
              />
            </>
          )}
        </div>
      </Layout>
  );
};

export default Tasks;
