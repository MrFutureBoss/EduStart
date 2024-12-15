import React, { useEffect, useState, useMemo } from "react";
import { Table, Card, Tag, Tooltip, message } from "antd";
import { SolutionOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassInfoData } from "../../redux/slice/ClassManagementSlice";
import {
  setProjects,
  setSelectedProjectToTop,
} from "../../redux/slice/ProjectSlice";
import { setSid } from "../../redux/slice/semesterSlide";

const TableIssueDashboard = ({ userId, jwt }) => {
  const [classData, setClassData] = useState([]);
  const [changingProjects, setChangingProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );
  const { sid } = useSelector(
    (state) => state.semester
  );
  const fetchCurrentSemester = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/semester/current`, config);
      const semesterData = response.data;
      dispatch(setSid(semesterData._id));
    } catch (error) {
      console.error("Error fetching current semester:", error);
      message.error("Lỗi khi tải dữ liệu Semester!");
    }
  };

  useEffect(() => {
    fetchCurrentSemester();
  }, [config]);
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
  const fetchGroupsForClass = async (classId) => {
    try {
      const res = await axios.get(`${BASE_URL}/group/class/${classId}/${sid}`, config);
      return res.data.groups || [];
    } catch (err) {
      console.error(`Error fetching groups for classId ${classId}:`, err);
      return [];
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
      // message.error("Lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);
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
  const classColumns = [
    {
      title: <span style={{ fontSize: "13.5px", fontWeight: "500" }}>STT</span>,
      key: "stt",
      render: (_, __, index) => (
        <span style={{ fontSize: "13.5px" }}>{index + 1}</span>
      ),
      width: "5%",
    },
    {
      title: (
        <span style={{ fontSize: "13.5px", fontWeight: "500" }}>
          Tên lớp ({classData.length})
        </span>
      ),
      dataIndex: "className",
      key: "className",
      render: (text) => <span style={{ fontSize: "13.5px" }}>{text}</span>,
      width: "25%",
    },
    {
      title: (
        <span style={{ fontSize: "13.5px", fontWeight: "500" }}>
          Vấn đề ({classData.reduce((total, cls) => total + cls.totalIssues, 0)}
          )
        </span>
      ),
      width: "70%",
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

            const groupList = issue.items.map((item, index) => (
              <Tag
                color="red"
                key={item.projectId || item.groupId}
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
                  marginRight: "4px",
                  textDecoration: "none",
                  color: "red",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#60b2c7";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "red";
                }}
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
                {index < issue.items.length - 1 && ", "}
              </Tag>
            ));

            return (
              <div key={issue.type} style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "500" }}>
                  {issue.type}{" "}
                  {issue.items.length > 1 ? (
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
                          {issue.items.map((item) => item.name).join(", ")}
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
                          color: "#60b2c7",
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleIssueClick(issue.type, record.className);
                        }}
                      >
                        ({issue.items.length})
                      </Link>
                    </Tooltip>
                  ) : null}
                  :
                </span>
                <span style={{ marginLeft: "8px" }}>{groupList}</span>
              </div>
            );
          }
          return null;
        });
      },
    },
  ];

  return (
    <Card
      title="Vấn đề cần giải quyết"
      bordered={false}
      size="small"
      headStyle={{
        backgroundColor: "rgb(96, 178, 199)",
        color: "white",
        fontSize: "17px",
      }}
      bodyStyle={{
        padding: "8px",
      }}
      style={{
        marginBottom: "16px",
        height: "fit-content",
        maxHeight: "340px",
        overflowY: "auto",
      }}
    >
      <Table
        dataSource={classData}
        columns={classColumns}
        pagination={false}
        rowKey="className"
        size="small"
        loading={loading}
      />
    </Card>
  );
};

export default TableIssueDashboard;
