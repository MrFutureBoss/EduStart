import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Table,
  Button,
  Tag,
  message,
  List,
  Steps,
  Tooltip,
  Typography,
  Popover,
} from "antd";
import {
  TeamOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  UserAddOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassInfoData } from "../../../redux/slice/ClassManagementSlice";
import {
  setProjects,
  setSelectedProjectToTop,
} from "../../../redux/slice/ProjectSlice";
import TeacherSemester from "../../semester/TeacherSemester";
import { useNavigate, Link } from "react-router-dom";
import PieChartDashboard from "./PieChartDashboard";
import {
  setClassSummaries,
  setLoadingClasses,
} from "../../../redux/slice/ClassSlice";
import { fetchClassSummaryData } from "../../../api";

const { Content } = Layout;
const { Step } = Steps;
const { Text } = Typography;
const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const userId = localStorage.getItem("userId");
  const jwt = localStorage.getItem("jwt");
  const [changingProjects, setChangingProjects] = useState([]);
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [semesterId, setSemesterId] = useState(null);
  const [outcomes, setOutcomes] = useState([]);
  const navigate = useNavigate();

  const classInfo = useSelector((state) => state.classManagement.classinfo);

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  const handleSemesterIdChange = (id) => {
    setSemesterId(id);
  };

  const fetchOutcomes = async (semesterId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/activity/outcome-type/semester/${semesterId}`,
        config
      );
      let fetchedOutcomes = res.data;
      fetchedOutcomes = fetchedOutcomes.sort((a, b) => {
        const aMatch = a.name.match(/(\d+)/);
        const bMatch = b.name.match(/(\d+)/);
        const aNum = aMatch ? parseInt(aMatch[1], 10) : 0;
        const bNum = bMatch ? parseInt(bMatch[1], 10) : 0;
        return aNum - bNum;
      });

      setOutcomes(fetchedOutcomes);
    } catch (err) {
      console.error("Error fetching outcomes:", err);
      message.error("Lỗi khi tải dữ liệu Outcome!");
    }
  };

  const fetchTempGroups = async (classId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/tempgroup/class/${classId}`,
        config
      );
      return res.data.data || [];
    } catch (err) {
      console.error(`Error fetching temp groups for classId ${classId}:`, err);
      return [];
    }
  };

  const fetchGroupsForClass = async (classId) => {
    try {
      const res = await axios.get(`${BASE_URL}/group/class/${classId}`, config);
      return res.data.groups || [];
    } catch (err) {
      console.error(`Error fetching groups for classId ${classId}:`, err);
      return [];
    }
  };

  const fetchGroupInfo = async (groupIds) => {
    const groupIdToClassId = {};

    const groupInfoPromises = groupIds.map((groupId) =>
      axios
        .get(`${BASE_URL}/group/group-infor/${groupId}`, config)
        .then((res) => {
          const groupInfo = res.data?.[0];
          if (groupInfo && groupInfo.classId) {
            groupIdToClassId[groupId] = groupInfo.classId;
          }
        })
        .catch((err) => {
          console.error(
            `Error fetching group info for groupId ${groupId}:`,
            err
          );
        })
    );

    await Promise.all(groupInfoPromises);

    return groupIdToClassId;
  };

  const handleIssueClick = (issueType, className) => {
    if (issueType === "Dự án cần duyệt") {
      navigate(`/teacher/project-request?tab=1`);
    } else if (issueType === "Dự án cập nhật lại") {
      navigate(`/teacher/project-request?tab=2`);
    } else if (issueType === "Nhóm chưa chốt đề tài") {
      navigate(
        `/teacher/class/detail/${encodeURIComponent(
          className
        )}?filter=unfinished`
      );
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const classRes = await axios.get(
        `${BASE_URL}/class/info/${userId}`,
        config
      );
      dispatch(setClassInfoData(classRes.data));
      const fetchedClasses = classRes.data.classes || [];
      const classIdToClassName = {};
      fetchedClasses.forEach((cls) => {
        classIdToClassName[cls._id] = cls.className;
      });
      const projectsRes = await axios.get(
        `${BASE_URL}/project/planning-projects/${userId}`,
        config
      );
      const projects = projectsRes.data || [];
      dispatch(setProjects(projects));
      const changingProjectsRes = await axios.get(
        `${BASE_URL}/project/changing-projects/${userId}`,
        config
      );
      const fetchedChangingProjects = changingProjectsRes.data || [];
      setChangingProjects(fetchedChangingProjects);
      const projectGroupIds = projects.map((project) => project.groupId);
      const changingProjectGroupIds = fetchedChangingProjects.map(
        (project) => project.groupId
      );
      const allGroupIds = [
        ...new Set([...projectGroupIds, ...changingProjectGroupIds]),
      ];
      const fetchedGroupIdToClassId = await fetchGroupInfo(allGroupIds);
      const groupIdToClassName = {};
      for (const groupId of allGroupIds) {
        const classId = fetchedGroupIdToClassId[groupId];
        const className = classIdToClassName[classId];
        if (className) {
          groupIdToClassName[groupId] = className;
        } else {
          console.warn(
            `No className found for classId: ${classId} (groupId: ${groupId})`
          );
        }
      }
      const classDataMap = {};

      fetchedClasses.forEach((cls) => {
        classDataMap[cls.className] = {
          className: cls.className,
          totalStudents: cls.totalStudents || cls.limitStudent || 0,
          totalGroups: cls.totalGroups || 0,
          issues: [],
        };
      });
      projects.forEach((project) => {
        const className = groupIdToClassName[project.groupId];
        if (className && classDataMap[className]) {
          const issueType = "Dự án cần duyệt";
          const issue = classDataMap[className].issues.find(
            (issue) => issue.type === issueType
          );

          if (issue) {
            issue.items.push({
              name: project.projectName,
              projectId: project.projectId,
              link: `/teacher/project-request?tab=1`,
            });
          } else {
            classDataMap[className].issues.push({
              type: issueType,
              items: [
                {
                  name: project.projectName,
                  projectId: project.projectId,
                  link: `/teacher/project-request?tab=1`,
                },
              ],
            });
          }
        } else {
          console.warn(
            `Class name not found for project "${project.projectName}" with groupId: ${project.groupId}`
          );
        }
      });
      fetchedChangingProjects.forEach((project) => {
        const className = groupIdToClassName[project.groupId];
        if (className && classDataMap[className]) {
          const issueType = "Dự án cập nhật lại";
          const issue = classDataMap[className].issues.find(
            (issue) => issue.type === issueType
          );

          if (issue) {
            issue.items.push({
              name: project.projectName,
              projectId: project.projectId,
              link: `/teacher/project-request?tab=2`,
            });
          } else {
            classDataMap[className].issues.push({
              type: issueType,
              items: [
                {
                  name: project.projectName,
                  projectId: project.projectId,
                  link: `/teacher/project-request?tab=2`,
                },
              ],
            });
          }
        } else {
          console.warn(
            `Class name not found for changing project "${project.projectName}" with groupId: ${project.groupId}`
          );
        }
      });
      const groupFetchPromises = fetchedClasses.map((cls) =>
        fetchGroupsForClass(cls._id).then((groups) => ({
          className: cls.className,
          groups,
        }))
      );

      const groupsByClass = await Promise.all(groupFetchPromises);

      groupsByClass.forEach(({ className, groups }) => {
        const unfinishedGroups = groups.filter(
          (group) => !group.projectId || !group.projectId._id
        );

        if (unfinishedGroups.length > 0) {
          const issueType = "Nhóm chưa chốt đề tài";
          const issue = classDataMap[className].issues.find(
            (issue) => issue.type === issueType
          );

          if (issue) {
            issue.items.push(
              ...unfinishedGroups.map((group) => ({
                name: group.name,
                groupId: group._id,
                className: className,
                link: `/teacher/class/detail/${encodeURIComponent(className)}`,
              }))
            );
          } else {
            classDataMap[className].issues.push({
              type: issueType,
              items: unfinishedGroups.map((group) => ({
                name: group.name,
                groupId: group._id,
                className: className,
                link: `/teacher/class/detail/${encodeURIComponent(className)}`,
              })),
            });
          }
        }
      });
      const tempGroupPromises = fetchedClasses.map((cls) =>
        fetchTempGroups(cls._id).then((tempGroups) => ({
          className: cls.className,
          tempGroups,
        }))
      );

      const tempGroupsByClass = await Promise.all(tempGroupPromises);

      const newNotifications = [];

      tempGroupsByClass.forEach(({ className, tempGroups }) => {
        if (tempGroups.length === 0) {
          newNotifications.push({
            type: "new_class",
            message: (
              <Link
                style={{ textDecoration: "none" }}
                to={`/teacher/class/detail/${encodeURIComponent(className)}`}
              >
                {`Lớp ${className} vừa được tạo mới, hãy tạo nhóm cho lớp ngay.`}
              </Link>
            ),
          });
        } else {
          const unfinished = tempGroups.filter(
            (group) => group.status === false
          ).length;
          if (unfinished > 0) {
            const total = tempGroups.length;
            newNotifications.push({
              type: "unfinished_groups",
              message: (
                <>
                  {unfinished} nhóm/{total} nhóm chưa chốt đủ thành viên trong
                  lớp{" "}
                  <Link
                    to={`/teacher/class/detail/${encodeURIComponent(
                      className
                    )}`}
                  >
                    {className}
                  </Link>
                  .
                </>
              ),
            });
          }
        }
      });
      if (newNotifications.length === 0) {
        newNotifications.push({
          type: "no_notifications",
          message: "Hiện tại chưa có thông báo nào.",
        });
      }

      setNotifications(newNotifications);

      const ongoingSemester = classInfo?.semesters?.find(
        (semester) => semester.status === "Ongoing"
      );

      if (ongoingSemester && ongoingSemester._id) {
        setSemesterId(ongoingSemester._id);
      }
      const updatedClassData = Object.values(classDataMap)
        .filter((cls) => cls.issues && cls.issues.length > 0)
        .map((cls) => {
          const totalIssues = cls.issues.reduce(
            (sum, issue) => sum + (issue.items ? issue.items.length : 0),
            0
          );
          return {
            ...cls,
            totalIssues,
            totalTypes: cls.issues.length,
          };
        })
        .sort((a, b) => {
          if (b.totalTypes !== a.totalTypes) {
            return b.totalTypes - a.totalTypes;
          }
          return b.totalIssues - a.totalIssues;
        });

      setClassData(updatedClassData);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  useEffect(() => {
    if (semesterId) {
      fetchOutcomes(semesterId);
    }
  }, [semesterId]);

  const handleProjectClick = (
    id,
    tab,
    isGroup = false,
    filterByUnfinished = false
  ) => {
    if (isGroup) {
      navigate(
        `/teacher/class/detail/${encodeURIComponent(id)}?filter=${
          filterByUnfinished ? "unfinished" : ""
        }`
      );
    } else if (tab === 1 || tab === 2) {
      dispatch(setSelectedProjectToTop({ projectId: id, tab }));
      navigate(`/teacher/project-request?tab=${tab}`);
    }
  };

  const renderOutcomes = () => {
    if (outcomes.length === 0) {
      return null;
    }
    const getPopoverContent = (description) => (
      <div style={{ maxWidth: 200 }}>
        <Text>{description}</Text>
      </div>
    );
    const getTitleWithInfo = (title, description) => (
      <span style={{ display: "flex", alignItems: "center" }}>
        <Popover
          content={getPopoverContent(description)}
          placement="bottom"
          trigger="hover"
        >
          {title}
        </Popover>
      </span>
    );

    return (
      <Steps
        direction="horizontal"
        size="default"
        progressDot={(dot, { status, index }) => (
          <span
            style={{
              width: 8,
              height: 8,
              backgroundColor:
                status === "process"
                  ? "#1890ff"
                  : status === "finish"
                  ? "#52c41a"
                  : "#d9d9d9",
              borderRadius: "50%",
              display: "inline-block",
            }}
          />
        )}
        current={2}
      >
        <Step
          key="create-group"
          title={getTitleWithInfo("Tạo nhóm", "Tạo nhóm cho lớp")}
          status="process"
        />
        <Step
          key="assign-mentor"
          title={getTitleWithInfo(
            "Chọn mentor cho nhóm",
            "Chọn mentor cho nhóm"
          )}
          status="process"
        />
        <Step
          key="approve-project"
          title={getTitleWithInfo("Duyệt dự án", "Duyệt dự án")}
          status="process"
        />
        {outcomes.map((outcome, index) => (
          <Step key={outcome._id} title={outcome.name} status="process" />
        ))}
      </Steps>
    );
  };

  const totalClasses = classData.length;
  const totalIssues = classData.reduce(
    (acc, cls) =>
      acc +
      cls.issues.reduce(
        (sum, issue) => sum + (issue.items ? issue.items.length : 0),
        0
      ),
    0
  );

  const classColumns = [
    {
      title: <span style={{ fontSize: "13.5px", fontWeight: "500" }}>STT</span>,
      key: "stt",
      render: (_, __, index) => (
        <span style={{ fontSize: "13.5px" }}>{index + 1}</span>
      ),
    },
    {
      title: (
        <span style={{ fontSize: "13.5px", fontWeight: "500" }}>
          Tên lớp ({totalClasses})
        </span>
      ),
      dataIndex: "className",
      key: "className",
      render: (text) => (
        <span style={{ fontSize: "13.5px" }}>
          <SolutionOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
    },
    {
      title: (
        <span style={{ fontSize: "13.5px", fontWeight: "500" }}>
          Vấn đề ({totalIssues})
        </span>
      ),
      dataIndex: "issues",
      key: "issues",
      render: (issues, record) => {
        if (!issues || issues.length === 0) {
          return null;
        }
        return issues.map((issue) => {
          if (issue.items && issue.items.length > 0) {
            let tab = null;
            let isGroup = false;

            if (issue.type === "Dự án cần duyệt") {
              tab = 1;
            } else if (issue.type === "Dự án cập nhật lại") {
              tab = 2;
            } else if (issue.type === "Nhóm chưa chốt đề tài") {
              isGroup = true;
            }

            const itemNames = issue.items.map((item) => item.name).join(", ");

            const tooltipContent = issue.items.map((item, index) => (
              <span key={item.projectId || item.groupId}>
                <Link
                  to={item.link}
                  onClick={(e) => {
                    e.preventDefault();
                    handleProjectClick(
                      isGroup ? item.className : item.projectId || item.groupId,
                      tab,
                      isGroup,
                      isGroup
                    );
                  }}
                >
                  {item.name}
                </Link>
                {index < issue.items.length - 1 && ", "}{" "}
              </span>
            ));

            return (
              <div key={issue.type} style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "450" }}>
                  {issue.type} :
                </span>{" "}
                {issue.items.length === 1 ? (
                  <Tag
                    color="red"
                    key={issue.items[0].projectId || issue.items[0].groupId}
                    style={{
                      marginRight: 4,
                      marginTop: 4,
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      handleProjectClick(
                        isGroup
                          ? issue.items[0].className
                          : issue.items[0].projectId || issue.items[0].groupId,
                        tab,
                        isGroup,
                        isGroup
                      )
                    }
                  >
                    {issue.items[0].name}
                  </Tag>
                ) : (
                  <Tooltip
                    title={
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                          maxWidth: "300px",
                        }}
                      >
                        {tooltipContent}
                      </div>
                    }
                  >
                    <Link
                      to={
                        issue.type === "Dự án cần duyệt"
                          ? `/project-approval/${tab}`
                          : issue.type === "Dự án cập nhật lại"
                          ? `/project-update/${tab}`
                          : isGroup
                          ? `/group-details/${record.className}`
                          : `/issue-detail/${issue.id}`
                      }
                      style={{
                        cursor: "pointer",
                        textDecoration: "none",
                        color: "red",
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleIssueClick(issue.type, record.className);
                      }}
                    >
                      {issue.items.length}
                    </Link>
                  </Tooltip>
                )}
              </div>
            );
          }
          return null;
        });
      },
    },
  ];

  const [sortedClassData, setSortedClassData] = useState([]);

  useEffect(() => {
    setSortedClassData([...classData]);
  }, [classData]);

  const handleSectionClick = (className) => {
    const sortedData = [...classData].sort((a, b) =>
      a.className === className ? -1 : b.className === className ? 1 : 0
    );
    setSortedClassData(sortedData);
  };

  const { classSummaries } = useSelector((state) => state.class);
  useEffect(() => {
    const loadData = async () => {
      dispatch(setLoadingClasses(true));
      try {
        const classResponse = await fetchClassSummaryData(userId);
        const { classSummaries: fetchedClassSummaries } = classResponse.data;
        dispatch(setClassSummaries(fetchedClassSummaries));
      } catch (error) {
        console.error("Error fetching data:", error);
        message.warning("Lỗi khi tải dữ liệu lớp học.");
      }
      dispatch(setLoadingClasses(false));
    };

    loadData();
  }, [userId, dispatch]);

  return (
    <Layout>
      <Content style={{ margin: "0", minHeight: 280 }}>
        <Row>{renderOutcomes()}</Row>
        <br />
        <Row gutter={16} style={{ marginBottom: "16px" }}>
          <Col span={15}>
            <Card
              title="Vấn đề cần giải quyết"
              bordered={false}
              size="small"
              headStyle={{
                backgroundColor: "rgb(96, 178, 199)",
                minHeight: "33px",
                color: "white",
                fontSize: "16px",
              }}
              bodyStyle={{
                padding: "8px",
              }}
              style={{ height: "300px", overflowY: "auto" }}
            >
              <Table
                dataSource={sortedClassData}
                columns={classColumns}
                pagination={false}
                rowKey="className"
                size="small"
                loading={loading}
                className="table-issue-dashboard"
              />
            </Card>
            <br />
            <Card
              title="Tình hình mentor"
              bordered={false}
              size="small"
              headStyle={{
                backgroundColor: "rgb(96, 178, 199)",
                minHeight: "33px",
                color: "white",
                fontSize: "16px",
              }}
              bodyStyle={{
                padding: "8px",
              }}
              style={{ height: "200px", overflowY: "auto" }}
            >
              {" "}
              {classSummaries.map((classItem) => {
                const matchedGroupsCount = classItem.groupDetails
                  ? classItem.groupDetails.filter(
                      (group) =>
                        group.isMatched === true &&
                        group.isProjectUpdated === true
                    ).length
                  : 0;
                const totalGroupsCount = classItem.groupDetails
                  ? classItem.groupDetails.filter(
                      (group) => group.isProjectUpdated === true
                    ).length
                  : 0;

                return (
                  <>
                    {classItem.className} ({matchedGroupsCount}/
                    {totalGroupsCount})
                  </>
                );
              })}
            </Card>
          </Col>

          <Col span={9}>
            <Card
              title="Tình hình chung"
              bordered={false}
              size="small"
              headStyle={{ fontSize: "16px", minHeight: "33px" }}
              bodyStyle={{
                maxHeight: "200px",
                overflowY: "auto",
                padding: "8px",
              }}
            >
              <List
                itemLayout="horizontal"
                dataSource={notifications}
                locale={{ emptyText: "Hiện tại chưa có thông báo nào." }}
                renderItem={(item) => (
                  <List.Item style={{ padding: "8px 0" }}>
                    <List.Item.Meta
                      avatar={
                        item.type === "new_class" ? (
                          <SolutionOutlined style={{ fontSize: "20px" }} />
                        ) : item.type === "unfinished_groups" ? (
                          <TeamOutlined style={{ fontSize: "20px" }} />
                        ) : item.type === "no_notifications" ? (
                          <></>
                        ) : null
                      }
                      title={
                        <span style={{ fontSize: "13px" }}>
                          {item.type === "no_notifications"
                            ? item.message
                            : item.message}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
            <br />
            <PieChartDashboard
              classData={classData || []}
              onSectionClick={handleSectionClick}
            />
            <br />
            <TeacherSemester onSemesterIdChange={handleSemesterIdChange} />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default TeacherDashboard;
