// src/components/ProjectCardMain/ProjectCardMain.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  Spin,
  Button,
  message,
  Tabs,
  Row,
  Col,
  Card,
  Alert,
  Badge,
  Modal,
} from "antd";
import "../../teacherCSS/ProjectCardMain.css";
import {
  fetchClassSummaryData,
  fetchProjectData,
  fetchMentorsTempMatching,
  getMatchedProjectClass,
  fetchSuggestMentors,
  deleteMatched,
} from "../../../../api";
import {
  setClassesWithUnupdatedProjects,
  setClassSummaries,
  setCounts,
  setEmptyClasses,
  setLoadingClasses,
  setMatchedClasses,
  setNotMatchedClasses,
} from "../../../../redux/slice/ClassSlice";
import ProjectCard from "../ProjectCard";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  pointerWithin,
} from "@dnd-kit/core";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SelectOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  setSelectedClassId,
  setLoadingProjects,
  setActiveId,
  updateAssignedMentorsMap,
  setClassMentorsData,
  setIsAssig,
} from "../../../../redux/slice/MatchingSlice";
import MentorSuggestionRow from "./MentorSuggestionRow";
import MentorDropZone from "./MentorDropZone";

const { Option } = Select;
const { TabPane } = Tabs;

const ProjectCardMain = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { classSummaries, loadingClasses } = useSelector(
    (state) => state.class
  );
  const { selectedClassId, loadingProjects, activeId, classData } = useSelector(
    (state) => state.matching
  );
  const teacherId = localStorage.getItem("userId");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showAllProfessions, setShowAllProfessions] = useState(false);
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const [visible, setVisible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupIdToDelete, setGroupIdToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      dispatch(setLoadingClasses(true));
      try {
        const classResponse = await fetchClassSummaryData(teacherId);
        const {
          classSummaries: fetchedClassSummaries,
          counts,
          matchedClasses,
          notMatchedClasses,
          emptyClasses,
          classesWithUnupdatedProjects,
        } = classResponse.data;

        dispatch(setClassSummaries(fetchedClassSummaries));
        dispatch(setCounts(counts));
        dispatch(setMatchedClasses(matchedClasses));
        dispatch(setNotMatchedClasses(notMatchedClasses));
        dispatch(setEmptyClasses(emptyClasses));
        dispatch(setClassesWithUnupdatedProjects(classesWithUnupdatedProjects));
      } catch (error) {
        console.error("Error fetching data:", error);
        message.warning("Lỗi khi tải dữ liệu lớp học.");
      }
      dispatch(setLoadingClasses(false));
    };
    loadData();
  }, [teacherId, dispatch]);

  // bắt sự kiện chọn lại mentor
  useEffect(() => {
    handleFetchClass(selectedClassId);
  }, [navigate]);
  // hàm để chuyển lớp
  const handleClassChange = async (classId) => {
    dispatch(setSelectedClassId(classId));
    localStorage.setItem("selectedClassId", classId);

    // Check if class data is already cached
    const existingClassData = classData[classId];

    if (existingClassData) {
      // Data exists in Redux; no need to fetch
      // Optionally, you can perform any additional actions if needed
      return;
    }
    dispatch(setIsAssig(false));
    // Data does not exist; fetch it
    dispatch(setLoadingProjects(true));
    try {
      // Fetch project data
      const projectResponse = await fetchProjectData(teacherId, classId);
      const projects = projectResponse.data.projects;

      // Initialize assignedMentorsMap
      const initialAssignedMap = {};
      projects.forEach((project) => {
        initialAssignedMap[project._id] = [];
      });

      // Fetch matched groups
      const matchedResponse = await getMatchedProjectClass(classId);
      const matchedData = matchedResponse.data;
      let pendingAccepted = [];
      let declined = [];
      let matchedGroups = [];

      if (matchedData.groups && Array.isArray(matchedData.groups)) {
        pendingAccepted = matchedData.groups.filter(
          (g) =>
            g.matchedInfo &&
            (g.matchedInfo.status === "Pending" ||
              g.matchedInfo.status === "Accepted")
        );
        declined = matchedData.groups.filter(
          (g) => g.matchedInfo && g.matchedInfo.status === "Rejected"
        );
        matchedGroups = matchedData.groups; // Assuming you need to store all matched groups
      }

      // Fetch mentor suggestions if necessary
      const mentorSuggestions = await fetchSuggestedMentors(
        classId,
        projects,
        initialAssignedMap
      );

      // Consolidate all fetched data
      const { mentorsData, assignedMentorsMap, showSuggestions } =
        mentorSuggestions;

      // Dispatch to set all class data at once
      dispatch(
        setClassMentorsData({
          classId,
          projectData: projects,
          mentorsData,
          assignedMentorsMap,
          showSuggestions,
          pendingAcceptedGroups: pendingAccepted,
          declinedGroups: declined,
          matchedGroups: matchedGroups,
        })
      );
    } catch (error) {
      console.error("Error in handleClassChange:", error);
      message.error("Có lỗi xảy ra khi tải dữ liệu lớp học.");
    } finally {
      dispatch(setLoadingProjects(false));
    }
  };

  const handleFetchClass = async (classId) => {
    dispatch(setSelectedClassId(classId));
    localStorage.setItem("selectedClassId", classId);

    // Check if class data is already cached

    dispatch(setIsAssig(false));
    // Data does not exist; fetch it
    dispatch(setLoadingProjects(true));
    try {
      // Fetch project data
      const projectResponse = await fetchProjectData(teacherId, classId);
      const projects = projectResponse.data.projects;

      // Initialize assignedMentorsMap
      const initialAssignedMap = {};
      projects.forEach((project) => {
        initialAssignedMap[project._id] = [];
      });

      // Fetch matched groups
      const matchedResponse = await getMatchedProjectClass(classId);
      const matchedData = matchedResponse.data;
      let pendingAccepted = [];
      let declined = [];
      let matchedGroups = [];

      if (matchedData.groups && Array.isArray(matchedData.groups)) {
        pendingAccepted = matchedData.groups.filter(
          (g) =>
            g.matchedInfo &&
            (g.matchedInfo.status === "Pending" ||
              g.matchedInfo.status === "Accepted")
        );
        declined = matchedData.groups.filter(
          (g) => g.matchedInfo && g.matchedInfo.status === "Rejected"
        );
        matchedGroups = matchedData.groups; // Assuming you need to store all matched groups
      }

      // Fetch mentor suggestions if necessary
      const mentorSuggestions = await fetchSuggestedMentors(
        classId,
        projects,
        initialAssignedMap
      );

      // Consolidate all fetched data
      const { mentorsData, assignedMentorsMap, showSuggestions } =
        mentorSuggestions;

      // Dispatch to set all class data at once
      dispatch(
        setClassMentorsData({
          classId,
          projectData: projects,
          mentorsData,
          assignedMentorsMap,
          showSuggestions,
          pendingAcceptedGroups: pendingAccepted,
          declinedGroups: declined,
          matchedGroups: matchedGroups,
        })
      );
    } catch (error) {
      console.error("Error in handleClassChange:", error);
      message.error("Có lỗi xảy ra khi tải dữ liệu lớp học.");
    } finally {
      dispatch(setLoadingProjects(false));
    }
  };
  const fetchSuggestedMentors = async (
    classId,
    projects,
    assignedMentorsMap
  ) => {
    setIsFetchingSuggestions(true);
    try {
      const unmatchedProjects = projects.filter((p) => !p.isMatched);
      const unmatchedProjectsMap = new Map(
        unmatchedProjects.map((proj) => [proj.groupId, proj])
      );

      const suggestResponse = await fetchSuggestMentors(classId);
      const suggestions = suggestResponse.data.suggestions || [];

      let mentorDataMap = {};
      let finalAssignedMentorsMap = { ...assignedMentorsMap };

      if (suggestions.length > 0) {
        const filteredSuggestions = suggestions.filter((item) =>
          unmatchedProjectsMap.has(item.groupId?._id)
        );

        filteredSuggestions.forEach((item) => {
          const groupId = item.groupId?._id;
          const project = unmatchedProjectsMap.get(groupId);
          if (project) {
            const projectId = project._id;
            mentorDataMap[projectId] = {
              mentorPreferred: item.mentorPreferred || [],
              teacherPreferredMentors: (
                item.teacherPreferredMentors || []
              ).sort((a, b) => a.priority - b.priority),
              matchingMentors: item.matchingMentors || [],
            };

            const {
              mentorPreferred,
              teacherPreferredMentors,
              matchingMentors,
            } = mentorDataMap[projectId];

            let initialMentor = null;
            if (mentorPreferred.length > 0) {
              initialMentor = mentorPreferred[0];
            } else if (teacherPreferredMentors.length > 0) {
              initialMentor = teacherPreferredMentors[0];
            } else if (matchingMentors.length > 0) {
              initialMentor = matchingMentors[0];
            }

            finalAssignedMentorsMap[projectId] = initialMentor
              ? [initialMentor]
              : [];
          }
        });

        return {
          mentorsData: mentorDataMap,
          assignedMentorsMap: finalAssignedMentorsMap,
          showSuggestions: true,
        };
      } else {
        return {
          mentorsData: {},
          assignedMentorsMap,
          showSuggestions: false,
        };
      }
    } catch (error) {
      console.error("Error fetching mentor suggestions:", error);
      message.error("Không thể lấy danh sách mentor gợi ý.");
      return {
        mentorsData: {},
        assignedMentorsMap,
        showSuggestions: false,
      };
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const fetchMatchingMentor = async () => {
    if (!selectedClassId) {
      return;
    }

    setIsFetchingSuggestions(true);
    dispatch(setLoadingProjects(true));
    try {
      const currentClassData = classData[selectedClassId];
      if (!currentClassData) {
        message.warning("Dữ liệu lớp không tồn tại.");
        return;
      }
      // Fetch temporary matching
      await fetchMentorsTempMatching(selectedClassId, teacherId);

      await handleFetchClass(selectedClassId);
    } catch (error) {
      console.error("Error in fetchMatchingMentor:", error);
      message.error("Có lỗi xảy ra khi gợi ý mentor.");
    } finally {
      dispatch(setLoadingProjects(false));
      setIsFetchingSuggestions(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && over.id.startsWith("project-")) {
      const projectId = over.id.replace("project-", "");
      const uniqueId = active.id;
      const mentorId = uniqueId.split("-").pop();

      const currentClassData = classData[selectedClassId];
      if (!currentClassData) {
        message.error("Dữ liệu lớp không tồn tại.");
        return;
      }

      const mentor =
        currentClassData.mentorsData[projectId]?.mentorPreferred?.find(
          (m) => String(m.mentorId) === String(mentorId)
        ) ||
        currentClassData.mentorsData[projectId]?.teacherPreferredMentors?.find(
          (m) => String(m.mentorId) === String(mentorId)
        ) ||
        currentClassData.mentorsData[projectId]?.matchingMentors?.find(
          (m) => String(m.mentorId) === String(mentorId)
        );

      if (mentor) {
        dispatch(
          updateAssignedMentorsMap({
            classId: selectedClassId,
            projectId,
            mentors: [mentor],
          })
        );

        // Update classMentorsData's assignedMentorsMap directly
        const updatedAssigned = {
          ...currentClassData.assignedMentorsMap,
          [projectId]: [mentor],
        };

        dispatch(
          setClassMentorsData({
            classId: selectedClassId,
            projectData: currentClassData.projectData,
            mentorsData: currentClassData.mentorsData,
            assignedMentorsMap: updatedAssigned,
            showSuggestions: currentClassData.showSuggestions,
            pendingAcceptedGroups: currentClassData.pendingAcceptedGroups,
            declinedGroups: currentClassData.declinedGroups,
            matchedGroups: currentClassData.matchedGroups,
          })
        );
      }
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await deleteMatched(groupIdToDelete);
      await handleFetchClass(selectedClassId);

      message.success("Ghép hiện tại đã bị xoá thành công!");
      navigate(`/teacher/temp-matching/select-mentor`);
    } catch (error) {
      console.error("Lỗi khi xoá ghép:", error);
      message.error("Có lỗi xảy ra khi xoá ghép, vui lòng thử lại!");
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };
  // Retrieve data for the selected class
  const selectedClassData = classData[selectedClassId] || {};

  //Mở model xác nhận
  const openModal = (groupId, projectId) => {
    setGroupIdToDelete(groupId);
    setModalVisible(true);
    const project = selectedClassData.projectData.find(
      (p) => p._id === projectId
    );
    localStorage.setItem("selectedProject", JSON.stringify({ project }));
  };

  const unmatchedProjects = selectedClassData.projectData
    ? selectedClassData.projectData.filter((project) => !project.isMatched)
    : [];

  const pendingAcceptedGroups = selectedClassData.pendingAcceptedGroups || [];
  const declinedGroups = selectedClassData.declinedGroups || [];

  const badgeMeanings = [
    {
      type: "C",
      description: "Mentor lựa chọn nhóm này",
      color: "#3390C1",
    },
    {
      type: "UT",
      description: "Mentor được giáo viên ưu tiên",
      color: "#faad14",
    },
    {
      type: "1",
      description: "Số chuyên môn trùng khớp",
      color: "#a8dcd1",
    },
  ];
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={({ active }) => dispatch(setActiveId(active.id))}
      onDragEnd={(event) => {
        dispatch(setActiveId(null));
        handleDragEnd(event);
      }}
    >
      <div className="main-project-container">
        <div className="header-bar">
          <div className="class-select-container" style={{ padding: "9px" }}>
            <label className="class-select-label">Lớp Được Chọn:</label>
            {loadingClasses ? (
              <Spin />
            ) : (
              <Select
                showSearch
                placeholder="Chọn lớp"
                optionFilterProp="children"
                onChange={handleClassChange}
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                value={selectedClassId}
                className="class-select"
              >
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
                    <Option key={classItem.classId} value={classItem.classId}>
                      {classItem.className} ({matchedGroupsCount}/
                      {totalGroupsCount})
                    </Option>
                  );
                })}
              </Select>
            )}
          </div>

          <div className="button-group">
            {unmatchedProjects.length > 0 && (
              <Button
                style={{ marginRight: "10px" }}
                onClick={fetchMatchingMentor}
                disabled={isFetchingSuggestions}
              >
                Gợi Ý Ghép Mentor
              </Button>
            )}
          </div>
        </div>

        <div
          className={`container-projects ${
            selectedClassData.showSuggestions ? "single-column" : "grid-layout"
          }`}
        >
          {visible && (
            <Alert
              type="info"
              closable
              onClose={() => setVisible(false)}
              message="Ý nghĩa của các biểu tượng"
              description={
                <div
                  style={{
                    display: "flex",
                    marginLeft: 25,
                    marginTop: -1,
                  }}
                >
                  {badgeMeanings.map((badge) => (
                    <div
                      key={badge.type}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Badge
                        count={badge.type}
                        style={{
                          backgroundColor: badge.color,
                          color: badge.type === "C" ? "white" : "black",
                          borderRadius: "12px",
                        }}
                      />
                      <span style={{ marginRight: 30 }}>
                        {badge.description}
                      </span>
                    </div>
                  ))}
                </div>
              }
            />
          )}
          {loadingProjects ? (
            <Spin />
          ) : unmatchedProjects.length > 0 ||
            pendingAcceptedGroups.length > 0 ||
            declinedGroups.length > 0 ? (
            <Tabs
              defaultActiveKey="1"
              style={{ width: "100%" }}
              destroyInactiveTabPane
            >
              {/* Tab Pane: Chưa chọn mentor */}
              <TabPane
                tab={`Chưa chọn mentor (${unmatchedProjects.length})`}
                key="1"
              >
                {unmatchedProjects.map((project) => {
                  const mentorPreferredIds = new Set(
                    (
                      selectedClassData.mentorsData[project._id]
                        ?.mentorPreferred || []
                    ).map((m) => String(m.mentorId))
                  );

                  const teacherPreferredIds = new Set(
                    (
                      selectedClassData.mentorsData[project._id]
                        ?.teacherPreferredMentors || []
                    ).map((m) => String(m.mentorId))
                  );

                  return (
                    <div
                      className={`single-project-row ${
                        selectedClassData.showSuggestions && !project.isMatched
                          ? "suggestion-layout"
                          : "grid-layout"
                      }`}
                      key={project._id}
                    >
                      <div className="project-card-wrapper">
                        <h6 className="main-title-suggest">Chưa Chọn Mentor</h6>
                        <ProjectCard
                          className="always-hover"
                          style={{ width: 370 }}
                          group={{
                            groupName: project.groupName,
                            className: project.className,
                          }}
                          project={project}
                          assignedMentors={
                            selectedClassData.assignedMentorsMap[project._id] ||
                            []
                          }
                        />
                      </div>

                      {selectedClassData.showSuggestions &&
                        selectedClassData.mentorsData[project._id] && (
                          <div className="suggestions-and-drop-zone">
                            <div className="mentor-suggestions-wrapper">
                              {/* Mentor Ưu Tiên Nhóm */}
                              <MentorSuggestionRow
                                title="Mentor Ưu Tiên Chọn Nhóm:"
                                mentors={
                                  selectedClassData.mentorsData[project._id]
                                    .mentorPreferred
                                }
                                assignedMentors={
                                  selectedClassData.assignedMentorsMap[
                                    project._id
                                  ] || []
                                }
                                projectId={project._id}
                                existingMentorIds={new Set()} // No exclusions for the first category
                                colorClass="mentor-preferred-card"
                                teacherPreferredMentors={
                                  selectedClassData.mentorsData[project._id]
                                    .teacherPreferredMentors
                                }
                              />
                              {/* Mentor Bạn Ưu Tiên */}
                              <MentorSuggestionRow
                                title="Mentor Được Giáo Viên Ưu Tiên:"
                                mentors={
                                  selectedClassData.mentorsData[project._id]
                                    .teacherPreferredMentors
                                }
                                projectId={project._id}
                                assignedMentors={
                                  selectedClassData.assignedMentorsMap[
                                    project._id
                                  ] || []
                                }
                                existingMentorIds={mentorPreferredIds} // Exclude mentors already in mentorPreferred
                                colorClass="teacher-preferred-card"
                                teacherPreferredMentors={
                                  selectedClassData.mentorsData[project._id]
                                    .teacherPreferredMentors
                                }
                              />
                              {/* Mentor Phù Hợp */}
                              <MentorSuggestionRow
                                title="Mentor Có Chuyên Môn Phù Hợp:"
                                mentors={
                                  selectedClassData.mentorsData[project._id]
                                    .matchingMentors
                                }
                                assignedMentors={
                                  selectedClassData.assignedMentorsMap[
                                    project._id
                                  ] || []
                                }
                                projectId={project._id}
                                existingMentorIds={
                                  new Set([
                                    ...mentorPreferredIds,
                                    ...teacherPreferredIds,
                                  ])
                                } // Exclude mentors already in mentorPreferred and teacherPreferred
                                colorClass="matching-mentors-card"
                                teacherPreferredMentors={
                                  selectedClassData.mentorsData[project._id]
                                    .teacherPreferredMentors
                                }
                              />
                            </div>
                            <MentorDropZone
                              projectId={project._id}
                              groupId={project.groupId}
                              assignedMentors={
                                selectedClassData.assignedMentorsMap[
                                  project._id
                                ]?.map((mentor) => ({
                                  ...mentor,
                                  isTeacherPreferred:
                                    selectedClassData.mentorsData[
                                      project._id
                                    ].teacherPreferredMentors.some(
                                      (teacherPreferred) =>
                                        String(teacherPreferred.mentorId) ===
                                        String(mentor.mentorId)
                                    ),
                                  isPreferredGroup:
                                    selectedClassData.mentorsData[
                                      project._id
                                    ].mentorPreferred.some(
                                      (preferredMentor) =>
                                        String(preferredMentor.mentorId) ===
                                        String(mentor.mentorId)
                                    ),
                                })) || []
                              }
                              mentors={
                                selectedClassData.mentorsData[project._id]
                              }
                              activeId={activeId}
                              onMentorAssigned={() =>
                                handleFetchClass(selectedClassId)
                              }
                              teacherId={teacherId}
                              selectedClassId={selectedClassId} // Thêm prop này
                            />
                          </div>
                        )}
                    </div>
                  );
                })}
              </TabPane>

              {/* Tab Pane: Đã ghép mentor */}
              <TabPane
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
                tab={`Đã ghép mentor (${pendingAcceptedGroups.length})`}
                key="2"
              >
                <Row gutter={[16, 16]}>
                  {pendingAcceptedGroups.map(({ group, matchedInfo }) => {
                    const statusText =
                      matchedInfo.status === "Pending"
                        ? "Chờ Mentor Chấp Nhận"
                        : "Mentor Đã Chấp Nhận";
                    const statusColor =
                      matchedInfo.status === "Pending"
                        ? "rgb(234 156 0)"
                        : "#52c41a";
                    const mentor = matchedInfo.mentorId;
                    const mentorCate = matchedInfo.mentorProfession;
                    const professions =
                      mentorCate?.professionIds?.map(
                        (profession) => profession.name
                      ) || [];

                    // Lấy danh sách specialties
                    const specialties =
                      mentorCate?.specialties?.map(
                        (specialty) => specialty.specialtyId.name
                      ) || [];
                    const statusIcon =
                      matchedInfo.status === "Pending" ? (
                        <ClockCircleOutlined
                          style={{ color: "#faad14", marginLeft: 8 }}
                        />
                      ) : (
                        <CheckCircleOutlined
                          style={{ color: "#52c41a", marginLeft: 8 }}
                        />
                      );

                    return (
                      <Col
                        xs={24}
                        sm={12}
                        md={12}
                        lg={12}
                        key={matchedInfo._id}
                      >
                        <div
                          className="single-project-row grid-layout"
                          key={matchedInfo._id}
                        >
                          <div className="project-card-wrapper">
                            <h6
                              style={{ color: statusColor }}
                              className="main-title-suggest"
                            >
                              {statusText}
                              {statusIcon}
                            </h6>
                            <ProjectCard
                              className="always-hover"
                              group={{
                                groupName: group.name,
                                className: group.classId.className,
                              }}
                              style={{ width: "533px" }}
                              project={{
                                _id: group.projectId._id,
                                name: group.projectId.name,
                                description: group.projectId.description,
                                groupId: group._id,
                                isMatched: true,
                                status:
                                  matchedInfo.status === "Pending"
                                    ? "Pending"
                                    : "Accepted",
                                projectCategory: matchedInfo.projectCategory,
                              }}
                              assignedMentors={[
                                {
                                  mentorId: mentor._id,
                                  username: mentor.username,
                                  email: mentor.email,
                                  phoneNumber: mentor.phoneNumber,
                                },
                              ]}
                            />
                            <div className="assigned-mentors">
                              {/* Mentor Info Card */}
                              <div
                                className="elevated-card"
                                style={{
                                  boxShadow: "rgb(135, 186, 207) 0px 2px 6px",
                                  borderRadius: 6,
                                  border: "none",
                                  backgroundColor: "#c2e1eb",
                                  padding: 7,
                                  marginBottom: 10,
                                  width: "402px",
                                  marginLeft: 10,
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "4px 10px",
                                    boxShadow: "0 2px 6px #87bacf",
                                    backgroundColor: "#62b6cb",
                                    fontWeight: "bold",
                                    border: "none",
                                    color: "#f0f8fa",
                                    borderRadius: "12px",
                                  }}
                                >
                                  Mentor Đã Chọn
                                </strong>
                                <div
                                  style={{
                                    borderRadius: 7,
                                    padding: 16,
                                    backgroundColor: "white",
                                  }}
                                >
                                  <Card.Meta
                                    description={
                                      <>
                                        <p
                                          style={{
                                            marginBottom: 2,
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <strong>Tên: </strong>
                                          {mentor?.username}
                                        </p>
                                        <p
                                          style={{
                                            marginBottom: 2,
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <strong>Email: </strong>
                                          {mentor?.email}
                                        </p>
                                        <p
                                          style={{
                                            marginBottom: 2,
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <strong>Số điện thoại: </strong>
                                          {mentor?.phoneNumber}
                                        </p>
                                        <p
                                          style={{
                                            marginBottom: 2,
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <strong>Danh sách lĩnh vực: </strong>
                                          <span>
                                            {professions
                                              .slice(
                                                0,
                                                showAllProfessions
                                                  ? professions.length
                                                  : 2
                                              )
                                              .join(", ")}
                                            {professions.length > 2 && (
                                              <button
                                                onClick={() =>
                                                  setShowAllProfessions(
                                                    !showAllProfessions
                                                  )
                                                }
                                                style={{
                                                  marginLeft: "8px",
                                                  color: "blue",
                                                  border: "none",
                                                  background: "none",
                                                  cursor: "pointer",
                                                }}
                                              >
                                                {showAllProfessions
                                                  ? "Ẩn bớt"
                                                  : "Xem thêm"}
                                              </button>
                                            )}
                                          </span>
                                        </p>
                                        <p
                                          style={{
                                            marginBottom: 2,
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <strong>
                                            Danh sách chuyên môn:{" "}
                                          </strong>
                                          <span>
                                            {specialties
                                              .slice(
                                                0,
                                                showAllSpecialties
                                                  ? specialties.length
                                                  : 1
                                              )
                                              .join(", ")}
                                            {specialties.length > 1 && (
                                              <button
                                                onClick={() =>
                                                  setShowAllSpecialties(
                                                    !showAllSpecialties
                                                  )
                                                }
                                                style={{
                                                  marginLeft: "8px",
                                                  color: "blue",
                                                  border: "none",
                                                  background: "none",
                                                  cursor: "pointer",
                                                }}
                                              >
                                                {showAllSpecialties
                                                  ? "Ẩn bớt"
                                                  : "Xem thêm"}
                                              </button>
                                            )}
                                          </span>
                                        </p>
                                      </>
                                    }
                                  />
                                </div>
                              </div>

                              <Button
                                type="link"
                                onClick={() =>
                                  openModal(group?._id, group?.projectId?._id)
                                }
                                style={{ color: "blue", padding: 0 }}
                              >
                                <SelectOutlined /> Chọn Lại Mentor
                              </Button>
                              <Modal
                                title={
                                  <>
                                    <ExclamationCircleOutlined
                                      style={{ color: "red", marginRight: 10 }}
                                    />
                                    <span style={{ color: "red" }}>
                                      Cảnh Báo
                                    </span>
                                  </>
                                }
                                visible={modalVisible}
                                onOk={handleConfirm} // Gọi API khi nhấn OK
                                onCancel={() => setModalVisible(false)}
                                confirmLoading={loading} // Hiển thị trạng thái loading khi đang xử lý
                                okText="Đồng ý"
                                cancelText="Hủy"
                              >
                                <p>
                                  Bạn có chắc chắn muốn chọn lại mentor không?
                                  Mentor đang được ghép hiện tại sẽ bị xoá.
                                </p>
                              </Modal>
                            </div>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </TabPane>

              {/* Tab Pane: Bị từ chối */}
              <TabPane
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
                tab={`Bị từ chối (${declinedGroups.length})`}
                key="3"
              >
                <Row gutter={[16, 16]}>
                  {declinedGroups.map(({ group, matchedInfo }) => {
                    const mentor = matchedInfo.mentorId;
                    const mentorCate = matchedInfo.mentorProfession;

                    const professions =
                      mentorCate?.professionIds?.map(
                        (profession) => profession.name
                      ) || [];

                    const specialties =
                      mentorCate?.specialties?.map(
                        (specialty) => specialty.specialtyId.name
                      ) || [];
                    const statusIcon =
                      matchedInfo.status === "Pending" ? (
                        <ClockCircleOutlined
                          style={{ color: "#faad14", marginLeft: 8 }}
                        />
                      ) : (
                        <CheckCircleOutlined
                          style={{ color: "#52c41a", marginLeft: 8 }}
                        />
                      );

                    return (
                      <Col
                        xs={24}
                        sm={12}
                        md={12}
                        lg={12}
                        key={matchedInfo._id}
                      >
                        <div
                          className="single-project-row grid-layout"
                          key={matchedInfo._id}
                        >
                          <div className="project-card-wrapper">
                            <h6
                              style={{ color: "red" }}
                              className="main-title-suggest"
                            >
                              Mentor Đã Từ Chối
                            </h6>
                            <ProjectCard
                              className="always-hover"
                              group={{
                                groupName: group.name,
                                className: group.classId.className,
                              }}
                              style={{ width: "533px" }}
                              project={{
                                _id: group.projectId._id,
                                name: group.projectId.name,
                                description: group.projectId.description,
                                groupId: group._id,
                                isMatched: true,
                                status: "Declined",
                              }}
                              assignedMentors={[
                                {
                                  mentorId: mentor._id,
                                  username: mentor.username,
                                  email: mentor.email,
                                  phoneNumber: mentor.phoneNumber,
                                },
                              ]}
                            />
                            <div className="assigned-mentors">
                              {/* Mentor Info Card */}
                              <div
                                className="elevated-card"
                                style={{
                                  boxShadow: "rgb(135, 186, 207) 0px 2px 6px",
                                  borderRadius: 6,
                                  border: "none",
                                  backgroundColor: "#c2e1eb",
                                  padding: 7,
                                  marginBottom: 10,
                                  width: "402px",
                                  marginLeft: 10,
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "4px 10px",
                                    boxShadow: "0 2px 6px #87bacf",
                                    backgroundColor: "#62b6cb",
                                    fontWeight: "bold",
                                    border: "none",
                                    color: "#f0f8fa",
                                    borderRadius: "12px",
                                  }}
                                >
                                  Mentor Đã Chọn
                                </strong>
                                <div
                                  style={{
                                    borderRadius: 7,
                                    padding: 16,
                                    backgroundColor: "white",
                                  }}
                                >
                                  <Card.Meta
                                    description={
                                      <>
                                        <p
                                          style={{
                                            marginBottom: 2,
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <strong>Tên: </strong>
                                          {mentor?.username}
                                        </p>
                                        <p
                                          style={{
                                            marginBottom: 2,
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <strong>Email: </strong>
                                          {mentor?.email}
                                        </p>
                                        <p
                                          style={{
                                            marginBottom: 2,
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <strong>Số điện thoại: </strong>
                                          {mentor?.phoneNumber}
                                        </p>
                                        <p
                                          style={{
                                            marginBottom: 2,
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <strong>Danh sách lĩnh vực: </strong>
                                          <span>
                                            {professions
                                              .slice(
                                                0,
                                                showAllProfessions
                                                  ? professions.length
                                                  : 2
                                              )
                                              .join(", ")}
                                            {professions.length > 2 && (
                                              <button
                                                onClick={() =>
                                                  setShowAllProfessions(
                                                    !showAllProfessions
                                                  )
                                                }
                                                style={{
                                                  marginLeft: "8px",
                                                  color: "blue",
                                                  border: "none",
                                                  background: "none",
                                                  cursor: "pointer",
                                                }}
                                              >
                                                {showAllProfessions
                                                  ? "Ẩn bớt"
                                                  : "Xem thêm"}
                                              </button>
                                            )}
                                          </span>
                                        </p>
                                        <p
                                          style={{
                                            marginBottom: 2,
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <strong>
                                            Danh sách chuyên môn:{" "}
                                          </strong>
                                          <span>
                                            {specialties
                                              .slice(
                                                0,
                                                showAllSpecialties
                                                  ? specialties.length
                                                  : 3
                                              )
                                              .join(", ")}
                                            {specialties.length > 3 && (
                                              <button
                                                onClick={() =>
                                                  setShowAllSpecialties(
                                                    !showAllSpecialties
                                                  )
                                                }
                                                style={{
                                                  marginLeft: "8px",
                                                  color: "blue",
                                                  border: "none",
                                                  background: "none",
                                                  cursor: "pointer",
                                                }}
                                              >
                                                {showAllSpecialties
                                                  ? "Ẩn bớt"
                                                  : "Xem thêm"}
                                              </button>
                                            )}
                                          </span>
                                        </p>
                                      </>
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </TabPane>
            </Tabs>
          ) : selectedClassId ? (
            (() => {
              const selectedClass = classSummaries.find(
                (cls) => cls.classId === selectedClassId
              );

              if (!selectedClass)
                return <p>Vui lòng chọn một lớp để xem dự án.</p>;

              return selectedClass.groupDetails?.length === 0 ? (
                <p>Lớp chưa có nhóm</p>
              ) : (
                selectedClass.isFullyMatched && (
                  <p>Lớp đã ghép xong tất cả các nhóm</p>
                )
              );
            })()
          ) : (
            <p>Vui lòng chọn một lớp để xem dự án.</p>
          )}
        </div>
      </div>
    </DndContext>
  );
};

export default ProjectCardMain;
