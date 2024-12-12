// src/components/ProjectCardMain/ProjectCardMain.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, Spin, Button, message, Tag, Tabs, Row, Col, Card } from "antd";
import "../../teacherCSS/ProjectCardMain.css";
import {
  fetchClassSummaryData,
  fetchProjectData,
  assignMentorToProject,
  fetchMentorsTempMatching,
  getMatchedProjectClass,
  fetchSuggestMentors,
} from "../../../../api";
import {
  setClassesWithUnupdatedProjects,
  setClassSummaries,
  setCounts,
  setEmptyClasses,
  setLoadingClasses,
  setMatchedClasses,
  setNotMatchedClasses,
  setPendingGroups,
} from "../../../../redux/slice/ClassSlice";
import ProjectCard from "../ProjectCard";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  pointerWithin,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  SelectOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  setSelectedClassId,
  setProjectData,
  setMentorsData,
  setAssignedMentorsMap,
  setLoadingProjects,
  setLoadingMentors,
  setShowSuggestions,
  setActiveId,
  updateAssignedMentorsMap,
  setPendingAcceptedGroups,
  setDeclinedGroups,
  setClassMentorsData,
  removeMentorFromProject,
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
  const {
    selectedClassId,
    projectData,
    mentorsData,
    assignedMentorsMap,
    loadingProjects,
    showSuggestions,
    activeId,
    pendingAcceptedGroups,
    declinedGroups,
    classMentorsData, // object { [classId]: { mentorsData, assignedMentorsMap, showSuggestions } }
  } = useSelector((state) => state.matching);

  const teacherId = localStorage.getItem("userId");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [matchedGroups, setMatchedGroups] = useState([]);
  const [showAllProfessions, setShowAllProfessions] = useState(false);
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);

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

  const restoreClassMentorData = (classId) => {
    const data = classMentorsData[classId];
    if (data) {
      dispatch(setMentorsData(data.mentorsData));
      dispatch(setAssignedMentorsMap(data.assignedMentorsMap));
      dispatch(setShowSuggestions(data.showSuggestions));
    } else {
      // Nếu chưa có dữ liệu trong Redux, thì set showSuggestions = false
      dispatch(setShowSuggestions(false));
    }
  };

  const handleClassChange = async (classId) => {
    dispatch(setSelectedClassId(classId));
    localStorage.setItem("selectedClassId", classId);
    dispatch(setLoadingProjects(true));

    try {
      // Kiểm tra xem lớp này đã có dữ liệu mentorsData trong redux chưa
      const existingData = classMentorsData[classId];

      // Fetch project data như thường
      const projectResponse = await fetchProjectData(teacherId, classId);
      const projects = projectResponse.data.projects;
      dispatch(setProjectData(projects));

      if (!existingData) {
        // Chưa có dữ liệu mentorsData cho lớp này => tạo assignedMentorsMap trống
        const initialAssignedMap = {};
        projects.forEach((project) => {
          initialAssignedMap[project._id] = [];
        });
        dispatch(setAssignedMentorsMap(initialAssignedMap));
        dispatch(setShowSuggestions(false));
      } else {
        // Đã có dữ liệu mentorsData cho lớp này => khôi phục
        // assignedMentorsMap, mentorsData, showSuggestions
        const { mentorsData, assignedMentorsMap, showSuggestions } =
          existingData;
        dispatch(setMentorsData(mentorsData));
        dispatch(setAssignedMentorsMap(assignedMentorsMap));
        dispatch(setShowSuggestions(showSuggestions));
      }

      // Gọi getMatchedProjectClass để lấy danh sách matched groups
      const matchedResponse = await getMatchedProjectClass(classId);
      const matchedData = matchedResponse.data;
      if (matchedData.groups && Array.isArray(matchedData.groups)) {
        const pendingAccepted = matchedData.groups.filter(
          (g) =>
            g.matchedInfo &&
            (g.matchedInfo.status === "Pending" ||
              g.matchedInfo.status === "Accepted")
        );
        const declined = matchedData.groups.filter(
          (g) => g.matchedInfo && g.matchedInfo.status === "Rejected"
        );

        dispatch(setPendingAcceptedGroups(pendingAccepted));
        dispatch(setDeclinedGroups(declined));
      } else {
        dispatch(setPendingAcceptedGroups([]));
        dispatch(setDeclinedGroups([]));
      }
      if (!existingData) {
        fetchSuggestedMentors();
      }
    } catch (error) {
      console.error("Error in handleClassChange:", error);
      dispatch(setPendingAcceptedGroups([]));
      dispatch(setDeclinedGroups([]));
    } finally {
      dispatch(setLoadingProjects(false));
    }
  };

  const fetchSuggestedMentors = async () => {
    if (!selectedClassId) {
      message.warning("Vui lòng chọn lớp trước khi xem gợi ý.");
      return;
    }

    setIsFetchingSuggestions(true);
    dispatch(setLoadingProjects(true));
    try {
      // Lấy ra các dự án chưa ghép mentor
      const unmatchedProjects = projectData.filter((p) => !p.isMatched);
      const unmatchedProjectsMap = new Map(
        unmatchedProjects.map((proj) => [proj.groupId, proj])
      );

      // Gọi API fetchSuggestMentors để lấy gợi ý mentor
      const suggestResponse = await fetchSuggestMentors(selectedClassId);
      const suggestions = suggestResponse.data.suggestions || [];

      let mentorDataMap = {};
      let finalAssignedMentorsMap = { ...assignedMentorsMap }; // Copy hiện tại

      if (suggestions.length > 0) {
        // Lọc suggestions chỉ giữ lại các nhóm có trong unmatchedProjects
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

            let initialMentor = null;
            const {
              mentorPreferred,
              teacherPreferredMentors,
              matchingMentors,
            } = mentorDataMap[projectId];

            if (mentorPreferred && mentorPreferred.length > 0) {
              initialMentor = mentorPreferred[0];
            } else if (
              teacherPreferredMentors &&
              teacherPreferredMentors.length > 0
            ) {
              initialMentor = teacherPreferredMentors[0];
            } else if (matchingMentors && matchingMentors.length > 0) {
              initialMentor = matchingMentors[0];
            }

            finalAssignedMentorsMap[projectId] = initialMentor
              ? [initialMentor]
              : [];
          }
        });

        dispatch(setMentorsData(mentorDataMap));
        dispatch(setAssignedMentorsMap(finalAssignedMentorsMap));
        dispatch(setShowSuggestions(true));
      } else {
        // Nếu không có suggestions, gọi fetchMentorsTempMatching
        const tempMatchingResponse = await fetchMentorsTempMatching(
          selectedClassId,
          teacherId
        );
        const tempMatchingData = tempMatchingResponse.data || [];

        tempMatchingData.forEach((matchingResult) => {
          const groupId = matchingResult.groupId;
          const project = unmatchedProjectsMap.get(groupId);
          if (project) {
            const projectId = project._id;
            mentorDataMap[projectId] = {
              mentorPreferred: matchingResult.mentorPreferred || [],
              teacherPreferredMentors: (
                matchingResult.teacherPreferredMentors || []
              ).sort((a, b) => a.priority - b.priority),
              matchingMentors: matchingResult.matchingMentors || [],
            };

            let initialMentor = null;
            const {
              mentorPreferred,
              teacherPreferredMentors,
              matchingMentors,
            } = mentorDataMap[projectId];

            if (mentorPreferred && mentorPreferred.length > 0) {
              initialMentor = mentorPreferred[0];
            } else if (
              teacherPreferredMentors &&
              teacherPreferredMentors.length > 0
            ) {
              initialMentor = teacherPreferredMentors[0];
            } else if (matchingMentors && matchingMentors.length > 0) {
              initialMentor = matchingMentors[0];
            }

            finalAssignedMentorsMap[projectId] = initialMentor
              ? [initialMentor]
              : [];
          }
        });

        dispatch(setMentorsData(mentorDataMap));
        dispatch(setAssignedMentorsMap(finalAssignedMentorsMap));
        dispatch(setShowSuggestions(true));
      }

      // Lưu lại dữ liệu mentorsData, assignedMentorsMap, showSuggestions vào redux
      dispatch(
        setClassMentorsData({
          classId: selectedClassId,
          mentorsData: mentorDataMap,
          assignedMentorsMap: finalAssignedMentorsMap,
          showSuggestions: true,
        })
      );
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu mentor:", error);
      message.error("Không thể lấy danh sách mentor gợi ý.");
    } finally {
      dispatch(setLoadingProjects(false));
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
      // Lấy ra các dự án chưa ghép mentor
      const unmatchedProjects = projectData.filter((p) => !p.isMatched);
      const unmatchedProjectsMap = new Map(
        unmatchedProjects.map((proj) => [proj.groupId, proj])
      );

      let mentorDataMap = {};
      let finalAssignedMentorsMap = { ...assignedMentorsMap }; // Copy hiện tại

      // Nếu không có suggestions, gọi fetchMentorsTempMatching
      const tempMatchingResponse = await fetchMentorsTempMatching(
        selectedClassId,
        teacherId
      );
      const tempMatchingData = tempMatchingResponse.data || [];

      tempMatchingData.forEach((matchingResult) => {
        const groupId = matchingResult.groupId;
        const project = unmatchedProjectsMap.get(groupId);
        if (project) {
          const projectId = project._id;
          mentorDataMap[projectId] = {
            mentorPreferred: matchingResult.mentorPreferred || [],
            teacherPreferredMentors: (
              matchingResult.teacherPreferredMentors || []
            ).sort((a, b) => a.priority - b.priority),
            matchingMentors: matchingResult.matchingMentors || [],
          };

          let initialMentor = null;
          const { mentorPreferred, teacherPreferredMentors, matchingMentors } =
            mentorDataMap[projectId];

          if (mentorPreferred && mentorPreferred.length > 0) {
            initialMentor = mentorPreferred[0];
          } else if (
            teacherPreferredMentors &&
            teacherPreferredMentors.length > 0
          ) {
            initialMentor = teacherPreferredMentors[0];
          } else if (matchingMentors && matchingMentors.length > 0) {
            initialMentor = matchingMentors[0];
          }

          finalAssignedMentorsMap[projectId] = initialMentor
            ? [initialMentor]
            : [];
        }
      });

      dispatch(setMentorsData(mentorDataMap));
      dispatch(setAssignedMentorsMap(finalAssignedMentorsMap));
      dispatch(setShowSuggestions(true));

      // Lưu lại dữ liệu mentorsData, assignedMentorsMap, showSuggestions vào redux
      dispatch(
        setClassMentorsData({
          classId: selectedClassId,
          mentorsData: mentorDataMap,
          assignedMentorsMap: finalAssignedMentorsMap,
          showSuggestions: true,
        })
      );
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu mentor:", error);
      message.error("Không thể lấy danh sách mentor gợi ý.");
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
      const mentor =
        mentorsData[projectId]?.mentorPreferred?.find(
          (m) => String(m.mentorId) === String(mentorId)
        ) ||
        mentorsData[projectId]?.teacherPreferredMentors?.find(
          (m) => String(m.mentorId) === String(mentorId)
        ) ||
        mentorsData[projectId]?.matchingMentors?.find(
          (m) => String(m.mentorId) === String(mentorId)
        );

      if (mentor) {
        dispatch(
          updateAssignedMentorsMap({
            projectId,
            mentors: [mentor],
          })
        );

        // Mỗi khi update assignedMentorsMap, cũng cập nhật classMentorsData
        const updatedAssigned = {
          ...assignedMentorsMap,
          [projectId]: [mentor],
        };
        dispatch(
          setClassMentorsData({
            classId: selectedClassId,
            mentorsData,
            assignedMentorsMap: updatedAssigned,
            showSuggestions,
          })
        );
      }
    }
  };

  const handleViewDetailSelection = (projectId) => {
    const project = projectData.find((p) => p._id === projectId);
    const mentors = mentorsData[projectId];
    const assignedMentors = assignedMentorsMap[projectId];
    localStorage.setItem(
      "selectedProject",
      JSON.stringify({ project, mentors, assignedMentors })
    );
    navigate(`detailed-selection/${projectId}`);
  };

  useEffect(() => {
    if (matchedGroups.length > 0) {
      const pendingAccepted = matchedGroups.filter(
        (g) =>
          g.matchedInfo.status === "Pending" ||
          g.matchedInfo.status === "Accepted"
      );
      const declined = matchedGroups.filter(
        (g) => g.matchedInfo.status === "Rejected"
      );

      dispatch(setPendingAcceptedGroups(pendingAccepted));
      dispatch(setDeclinedGroups(declined));
    }
  }, [matchedGroups, dispatch]);

  const unmatchedProjects = projectData.filter((project) => !project.isMatched);

  // Hàm xử lý khi nhấn "Chọn Lại Mentor"
  const handleReselectMentor = (projectId) => {
    // Xác nhận hành động từ người dùng
    message.loading("Đang xử lý...", 1).then(() => {
      // Dispatch hành động để loại bỏ mentor từ dự án
      dispatch(removeMentorFromProject({ projectId }));

      // Thông báo thành công
      message.success(
        "Đã loại bỏ mentor hiện tại. Nhóm đã được đưa trở lại tab 'Chưa chọn mentor'."
      );
    });
  };

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
            <label className="class-select-label">Chọn Lớp:</label>
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
              <>
                <Button
                  style={{ marginRight: "10px" }}
                  onClick={fetchMatchingMentor}
                  disabled={isFetchingSuggestions}
                >
                  Gợi Ý Ghép Mới
                </Button>
              </>
            )}
          </div>
        </div>

        <div
          className={`container-projects ${
            showSuggestions ? "single-column" : "grid-layout"
          }`}
        >
          {loadingProjects ? (
            <Spin />
          ) : projectData.length > 0 || matchedGroups.length > 0 ? (
            <Tabs
              defaultActiveKey="1"
              style={{ width: "100%" }}
              destroyInactiveTabPane
            >
              <TabPane
                tab={`Chưa chọn mentor (${unmatchedProjects.length})`}
                key="1"
              >
                {unmatchedProjects.map((project) => {
                  // Collect all existing mentorIds to exclude them in lower categories
                  const mentorPreferredIds = new Set(
                    (mentorsData[project._id]?.mentorPreferred || []).map((m) =>
                      String(m.mentorId)
                    )
                  );

                  const teacherPreferredIds = new Set(
                    (
                      mentorsData[project._id]?.teacherPreferredMentors || []
                    ).map((m) => String(m.mentorId))
                  );

                  const existingMentorIds = new Set([...mentorPreferredIds]);

                  return (
                    <div
                      className={`single-project-row ${
                        showSuggestions && !project.isMatched
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
                            assignedMentorsMap[project._id] || []
                          }
                        />
                      </div>

                      {showSuggestions && mentorsData[project._id] && (
                        <div className="suggestions-and-drop-zone">
                          <div className="mentor-suggestions-wrapper">
                            {/* Mentor Ưu Tiên Nhóm */}
                            <MentorSuggestionRow
                              title="Mentor Ưu Tiên Nhóm:"
                              mentors={mentorsData[project._id].mentorPreferred}
                              assignedMentors={
                                assignedMentorsMap[project._id] || []
                              }
                              projectId={project._id}
                              existingMentorIds={new Set()} // No exclusions for the first category
                              colorClass="mentor-preferred-card"
                              teacherPreferredMentors={
                                mentorsData[project._id].teacherPreferredMentors
                              }
                            />
                            {/* Mentor Bạn Ưu Tiên */}
                            <MentorSuggestionRow
                              title="Mentor Bạn Ưu Tiên:"
                              mentors={
                                mentorsData[project._id].teacherPreferredMentors
                              }
                              projectId={project._id}
                              assignedMentors={
                                assignedMentorsMap[project._id] || []
                              }
                              existingMentorIds={mentorPreferredIds} // Exclude mentors already in mentorPreferred
                              colorClass="teacher-preferred-card"
                              teacherPreferredMentors={
                                mentorsData[project._id].teacherPreferredMentors
                              }
                            />
                            {/* Mentor Phù Hợp */}
                            <MentorSuggestionRow
                              title="Mentor Phù Hợp:"
                              mentors={mentorsData[project._id].matchingMentors}
                              assignedMentors={
                                assignedMentorsMap[project._id] || []
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
                                mentorsData[project._id].teacherPreferredMentors
                              }
                            />
                          </div>
                          <MentorDropZone
                            projectId={project._id}
                            groupId={project.groupId}
                            assignedMentors={
                              assignedMentorsMap[project._id]?.map(
                                (mentor) => ({
                                  ...mentor,
                                  isTeacherPreferred: mentorsData[
                                    project._id
                                  ].teacherPreferredMentors.some(
                                    (teacherPreferred) =>
                                      String(teacherPreferred.mentorId) ===
                                      String(mentor.mentorId)
                                  ),
                                })
                              ) || []
                            }
                            mentors={mentorsData[project._id]}
                            activeId={activeId}
                            onMentorAssigned={() => fetchMatchingMentor()}
                            teacherId={teacherId}
                          />
                          <h6 className="view-more-suggest">
                            <p
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                handleViewDetailSelection(project._id)
                              }
                            >
                              <SelectOutlined /> Lựa Chọn Chi Tiết
                            </p>
                          </h6>
                        </div>
                      )}
                    </div>
                  );
                })}
              </TabPane>

              {/* Other TabPanes */}
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

                    // Lấy danh sách specialty
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
                              {/* You can reuse MentorInfoCard here */}
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
                              <Button
                                type="link"
                                onClick={() =>
                                  handleReselectMentor(group.projectId._id)
                                }
                                style={{ color: "blue", padding: 0 }}
                              >
                                <SelectOutlined /> Chọn Lại Mentor
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </TabPane>

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
                              {/* You can reuse MentorInfoCard here */}
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
