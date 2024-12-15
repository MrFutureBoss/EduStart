import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Table,
  Tag,
  message,
  List,
  Steps,
  Tooltip,
  Typography,
} from "antd";
import {
  TeamOutlined,
  SolutionOutlined,
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
import { setLoadingClasses } from "../../../redux/slice/ClassSlice";
import { fetchClassSummaryData } from "../../../api";
import { setSelectedClassId } from "../../../redux/slice/MatchingSlice";
import {
  setCurrentSemester,
  setSemester,
  setSemesterName,
  setSid,
} from "../../../redux/slice/semesterSlide";

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
  const { currentSemester, semester, sid, semesterName } = useSelector(
    (state) => state.semester
  );

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );
  const fetchCurrentSemester = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/semester/current`, config);
      const semesterData = response.data;
      dispatch(setSid(semesterData._id));
      dispatch(setSemesterName(semesterData.name));
      dispatch(setCurrentSemester(semesterData));
      dispatch(setSemester(semesterData));
    } catch (error) {
      console.error("Error fetching current semester:", error);
      message.error("Lỗi khi tải dữ liệu Semester!");
    }
  };

  useEffect(() => {
    fetchCurrentSemester();
  }, [config]);

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
      // message.error("Lỗi khi tải dữ liệu Outcome!");
    }
  };
  const fetchGroupsForClass = async (classId) => {
    if (!classId || typeof classId !== "string" || classId.trim() === "") {
      return [];
    }
    try {
      const res = await axios.get(
        `${BASE_URL}/group/class/${classId}/${sid}`,
        config
      );
      return res.data.groups || [];
    } catch (err) {
      // console.error(`Error fetching groups for classId ${classId}:`, err);
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

  const handleIssueClick = (issueType, classId) => {
    if (issueType === "Dự án cần duyệt") {
      navigate(`/teacher/project-request?tab=1`);
    } else if (issueType === "Dự án cập nhật lại") {
      navigate(`/teacher/project-request?tab=2`);
    } else if (
      issueType === "Nhóm chưa chốt đề tài" ||
      issueType === "Nhóm chưa chọn mentor"
    ) {
      if (issueType === "Nhóm chưa chốt đề tài") {
        navigate(`/teacher/class/detail/${classId}?filter=unfinished`);
      } else if (issueType === "Nhóm chưa chọn mentor") {
        dispatch(setSelectedClassId(classId));
        localStorage.setItem("selectedClassId", classId);
        navigate(`/teacher/temp-matching`);
      }
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

      const classSummariesRes = await fetchClassSummaryData(userId, sid);
      const fetchedClassSummaries = classSummariesRes.data.classSummaries || [];

      fetchedClassSummaries.forEach((classSummary) => {
        const className = classSummary.className;
        const unmatchedGroupsCount = classSummary.groupDetails
          ? classSummary.groupDetails.filter((group) => !group.isMatched).length
          : 0;

        const totalGroupsCount = classSummary.groupDetails
          ? classSummary.groupDetails.length
          : 0;

        if (unmatchedGroupsCount > 0 && classDataMap[className]) {
          const issueType = "Nhóm chưa chọn mentor";
          const issue = classDataMap[className].issues.find(
            (issue) => issue.type === issueType
          );

          if (issue) {
            issue.items.push({
              count: unmatchedGroupsCount,
              link: `/teacher/temp-matching`,
              classId: classSummary.classId,
              total: totalGroupsCount,
            });
          } else {
            classDataMap[className].issues.push({
              type: issueType,
              items: [
                {
                  count: unmatchedGroupsCount,
                  link: `/teacher/temp-matching`,
                  classId: classSummary.classId,
                  total: totalGroupsCount,
                },
              ],
            });
          }
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

      const newNotifications = [];

      // Xử lý notifications như trước
      groupsByClass.forEach(({ className, groups }) => {
        const unfinished = groups.filter(
          (group) => !group.projectId || !group.projectId._id
        ).length;
        if (unfinished > 0) {
          const total = groups.length;
          newNotifications.push({
            type: "unfinished_groups",
            message: (
              <>
                {unfinished}/{total} nhóm chưa chốt đủ thành viên trong lớp{" "}
                <Link
                  to={`/teacher/class/detail/${encodeURIComponent(className)}`}
                >
                  {className}
                </Link>
                .
              </>
            ),
          });
        }
      });
      if (newNotifications.length === 0) {
        newNotifications.push({
          type: "no_notifications",
          message: "Hiện tại chưa có thông báo nào.",
        });
      }

      setNotifications(newNotifications);

      setSemesterId(sid);
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
      console.error("Error fetching data:", error);
      // message.error("Lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && sid) {
      fetchData();
    }
  }, [userId, sid]);

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
        <Tooltip title={description}></Tooltip>
        {title}
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
        style={{
          backgroundColor: "#fff",
          padding: "12px 8px 6px 8px",
          borderTopRightRadius: "10px",
          borderTopLeftRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: "5px solid #60b2c7",
          borderRight: "5px solid #60b2c7",
        }}
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
            let isMentorIssue = false;

            if (issue.type === "Dự án cần duyệt") {
              tab = 1;
            } else if (issue.type === "Dự án cập nhật lại") {
              tab = 2;
            } else if (issue.type === "Nhóm chưa chốt đề tài") {
              isGroup = true;
            } else if (issue.type === "Nhóm chưa chọn mentor") {
              isMentorIssue = true;
              isGroup = true; // Vì liên quan đến nhóm
            }
            const issueTypeLabel = issue.type.includes("Dự án")
              ? " dự án"
              : " nhóm";

            return (
              <div key={issue.type} style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "450" }}>
                  {issue.type} :
                </span>{" "}
                {issue.type === "Nhóm chưa chọn mentor" ? (
                  <Link
                    to={issue.items[0].link}
                    style={{
                      marginRight: 4,
                      marginTop: 4,
                      cursor: "pointer",
                      color: "red",
                      textDecoration: "none",
                      fontSize: "13.5px",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleIssueClick(issue.type, issue.items[0].classId);
                    }}
                  >
                    {issue.items[0].count}/{issue.items[0]?.total} Nhóm
                  </Link>
                ) : issue.items.length === 1 ? (
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
                        {issue.items.map((item, index) => (
                          <span key={item.projectId || item.groupId}>
                            <Link
                              to={item.link}
                              onClick={(e) => {
                                e.preventDefault();
                                handleProjectClick(
                                  isGroup
                                    ? item.className
                                    : item.projectId || item.groupId,
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
                        ))}
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
                      {issue.items.length} {issueTypeLabel}
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
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                height: "fit-content",
              }}
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
