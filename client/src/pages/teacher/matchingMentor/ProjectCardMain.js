import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  Spin,
  Button,
  message,
  Tag,
  Avatar,
  Tooltip,
  Badge,
  Progress,
} from "antd";
import "../teacherCSS/ProjectCardMain.css";
import {
  fetchClassSummaryData,
  fetchProjectData,
  assignMentorToProject,
  fetchMentorsTempMatching,
} from "../../../api";
import {
  setClassesWithUnupdatedProjects,
  setClassSummaries,
  setCounts,
  setEmptyClasses,
  setLoadingClasses,
  setMatchedClasses,
  setNotMatchedClasses,
} from "../../../redux/slice/ClassSlice";
import ProjectCard from "./ProjectCard";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  pointerWithin,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CheckOutlined, SelectOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  setSelectedClassId,
  setProjectData,
  setMentors,
  setAssignedMentorsMap,
  setLoadingProjects,
  setLoadingMentors,
  setShowSuggestions,
  setActiveId,
  updateAssignedMentorsMap,
  setMentorsData,
} from "../../../redux/slice/MatchingSlice";

const { Option } = Select;

// Component Draggable Mentor Card
const DraggableMentorCard = ({
  mentor,
  projectId,
  colorClass,
  isTeacherPreferred,
}) => {
  const uniqueId = `${projectId}-${mentor.mentorId}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id: uniqueId,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: "transform 0.15s ease",
    opacity: isDragging ? 0.8 : 1,
    cursor: "grab",
    margin: "8px",
  };

  const [showDetails, setShowDetails] = useState(false);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const specialtiesList = mentor.matchedSpecialties.map((specialty, index) => (
    <p key={index} style={{ margin: 0 }}>
      {specialty.name}
    </p>
  ));

  return (
    <Tooltip
      color="#a8dcd1"
      title={
        specialtiesList.length > 0
          ? specialtiesList
          : "Mentor này không có chuyên môn nào trùng với dự án"
      }
    >
      <div style={{ position: "relative", display: "inline-block" }}>
        <Badge
          count={
            !isDragging
              ? mentor.matchedSpecialties.length > 0
                ? mentor.matchedSpecialties.length
                : "0"
              : 0
          }
          offset={[-6, 2]}
          style={{
            backgroundColor: "#a8dcd1",
            color: "black",
            transform: "scale(0.7)",
            transformOrigin: "center",
          }}
        >
          <div style={{ position: "absolute", top: 0, right: 0 }}>
            {mentor.isPreferredGroup && (
              <Badge
                count={!isDragging ? "C" : 0}
                style={{
                  backgroundColor: "#3390C1",
                  color: "white",
                  marginRight: 2,
                  transform: "scale(0.7)",
                  transformOrigin: "center",
                  zIndex: 10,
                }}
                offset={[7, 16]}
              />
            )}
          </div>
          <div style={{ position: "absolute", top: 0, right: 0 }}>
            {isTeacherPreferred && (
              <Badge
                count={!isDragging ? "UT" : 0}
                style={{
                  backgroundColor: "#faad14",
                  color: "black",
                  transform: "scale(0.6)",
                  transformOrigin: "center",
                  zIndex: 10,
                }}
                offset={[-23, -2]}
              />
            )}
          </div>
          {isTeacherPreferred ? (
            <div
              ref={setNodeRef}
              style={style}
              {...attributes}
              {...listeners}
              className={`draggable-mentor-card ${colorClass}`}
              onClick={toggleDetails}
            >
              <Avatar src={mentor.avatarUrl} alt={mentor.username} size={28} />
              <div className="mentor-card-content1">
                <h4>{mentor.username}</h4>
                {showDetails && <p>{mentor.email}</p>}
              </div>
            </div>
          ) : (
            <div
              ref={setNodeRef}
              style={style}
              {...attributes}
              {...listeners}
              className={`draggable-mentor-card ${colorClass}`}
              onClick={toggleDetails}
            >
              <Avatar src={mentor.avatarUrl} alt={mentor.username} size={28} />
              <div className="mentor-card-content1">
                <h4>{mentor.username}</h4>
                {showDetails && <p>{mentor.email}</p>}
              </div>
            </div>
          )}
        </Badge>
      </div>
    </Tooltip>
  );
};

// Component Mentor Suggestion Row
const MentorSuggestionRow = ({
  title,
  mentors,
  projectId,
  assignedMentors = [],
  existingMentorIds,
  colorClass,
  teacherPreferredMentors = [],
}) => {
  const [showAll, setShowAll] = useState(false);
  const maxDisplay = 5;
  const assignedMentorIds = new Set(
    (assignedMentors || []).map((m) => m.mentorId)
  );

  // Lọc mentor để loại bỏ trùng lặp và mentor đã được gán
  const uniqueMentors = mentors.filter(
    (mentor) =>
      !existingMentorIds.has(mentor.mentorId) &&
      !assignedMentorIds.has(mentor.mentorId)
  );

  if (uniqueMentors.length === 0) return null;

  const displayedMentors = showAll
    ? uniqueMentors
    : uniqueMentors.slice(0, maxDisplay);

  const handleToggleShowAll = () => {
    setShowAll(!showAll);
  };
  console.log("displayedMentors", displayedMentors);

  return (
    <div className="mentor-suggestion-row">
      <div className="mentor-suggestion-title">
        {title}
        <strong className="blinking-number"> {displayedMentors.length}</strong>
      </div>
      <div className="mentor-cards-row">
        {displayedMentors.map((mentor) => (
          <DraggableMentorCard
            key={mentor.mentorId}
            mentor={mentor}
            projectId={projectId}
            colorClass={colorClass}
            isTeacherPreferred={teacherPreferredMentors.some(
              (teacherMentor) => teacherMentor.mentorId === mentor.mentorId
            )}
          />
        ))}
        {uniqueMentors.length > maxDisplay && (
          <Button type="link" onClick={handleToggleShowAll}>
            {showAll ? "Ẩn bớt" : "Xem thêm"}
          </Button>
        )}
      </div>
    </div>
  );
};

const MentorDropZone = ({
  projectId,
  groupId,
  assignedMentors,
  mentors,
  activeId,
  onMentorAssigned,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `project-${projectId}`,
  });

  const [draggedMentor, setDraggedMentor] = useState(null);

  // Xác định mentor đang được kéo vào ô nhận
  useEffect(() => {
    if (isOver && activeId) {
      const mentorId = activeId.split("-").pop();
      const mentor =
        mentors?.mentorPreferred?.find((m) => m.mentorId === mentorId) ||
        mentors?.teacherPreferredMentors?.find(
          (m) => m.mentorId === mentorId
        ) ||
        mentors?.matchingMentors?.find((m) => m.mentorId === mentorId);
      if (mentor) {
        // Kiểm tra xem mentor có thuộc danh sách teacherPreferredMentors không
        const isTeacherPreferred = mentors?.teacherPreferredMentors?.some(
          (teacherMentor) => teacherMentor.mentorId === mentorId
        );

        // Cập nhật mentor với thuộc tính isTeacherPreferred nếu có
        setDraggedMentor({
          ...mentor,
          isTeacherPreferred,
        });
      }
    } else {
      setDraggedMentor(null);
    }
  }, [isOver, activeId, mentors]);

  const handleConfirmMentor = () => {
    const mentor = assignedMentors[0];
    if (mentor) {
      assignMentorToProject(groupId, mentor.mentorId)
        .then(() => {
          message.success("Gán mentor thành công!");
          // Gọi hàm reloadProjectData sau khi gán mentor thành công
          if (onMentorAssigned) {
            onMentorAssigned();
          }
        })
        .catch((error) => {
          console.error("Lỗi khi gán mentor:", error);
          message.error("Gán mentor thất bại.");
        });
    }
  };

  const style = {
    border: isOver ? "2px dashed #52c41a" : "2px dashed #ccc",
    padding: "10px",
    borderRadius: "60px",
    backgroundColor: isOver ? "#f6ffed" : "#fafafa",
    marginTop: "10px",
    height: "115px",
    width: "250px",
    minWidth: "fit-content",
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Tag
        style={{
          position: "absolute",
          zIndex: 10,
          transform: "translate(-9px, -19px)",
          borderRadius: "30px",
          fontSize: 12,
          backgroundColor: "#DCE2C8",
        }}
      >
        Gợi ý
      </Tag>

      {/* Hiển thị mentor đang được kéo vào (preview) */}
      {isOver && draggedMentor && (
        <div className="mentor-info-card preview-card">
          <Tooltip title="Mentor đang được kéo vào" color="#faad14">
            <Badge
              showZero
              count={
                draggedMentor.matchedSpecialties.length > 0
                  ? draggedMentor.matchedSpecialties.length
                  : "0"
              }
              offset={[-11, -12]}
              style={{
                backgroundColor: "rgb(168, 220, 209)",
                color: "black",
                transform: "scale(0.8)",
                transformOrigin: "center",
              }}
            >
              <div style={{ position: "absolute", top: 0, right: 0 }}>
                {draggedMentor.isPreferredGroup && (
                  <Badge
                    count="C"
                    style={{
                      backgroundColor: "#3390C1",
                      color: "white",
                      transform: "scale(0.8)",
                      transformOrigin: "center",
                      zIndex: 10,
                    }}
                    offset={[7, 1]}
                  />
                )}
              </div>
              <div style={{ position: "absolute", top: 0, right: 0 }}>
                {draggedMentor.isTeacherPreferred && (
                  <Badge
                    count="UT"
                    style={{
                      backgroundColor: "#faad14",
                      color: "black",
                      transform: "scale(0.7)",
                      transformOrigin: "center",
                      zIndex: 10,
                    }}
                    offset={[-29, -22]}
                  />
                )}
              </div>
              <div className="mentor-info-content">
                <div className="mentor-info-left">
                  <Avatar
                    src={draggedMentor.avatarUrl}
                    alt={draggedMentor.username}
                    size={40}
                  />
                  <div>
                    <p>
                      <strong>{draggedMentor.username}</strong>
                    </p>
                    <p style={{ fontSize: "12px", color: "#888" }}>
                      {draggedMentor.email}
                    </p>
                    <Tooltip
                      title={`${draggedMentor.currentLoad}/${draggedMentor.maxLoad}`}
                    >
                      <Progress
                        percent={
                          (draggedMentor.currentLoad / draggedMentor.maxLoad) *
                          100
                        }
                        size="small"
                        status="active"
                        showInfo={false}
                        style={{
                          marginTop: 6,
                          marginLeft: "6px",
                          width: "86%",
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Badge>
          </Tooltip>
        </div>
      )}

      {/* Hiển thị mentor đã được gán, làm mờ nếu đang kéo mentor mới vào */}
      {assignedMentors.length > 0 &&
        assignedMentors.map((mentor) => (
          <div
            key={mentor.mentorId}
            className={`mentor-info-card ${
              isOver && draggedMentor ? "fade-out" : ""
            }`}
          >
            <Tooltip title="Mentor đã được gán" color="#5ba7ae">
              <Badge
                showZero
                count={
                  mentor.matchedSpecialties.length > 0
                    ? mentor.matchedSpecialties.length
                    : "0"
                }
                offset={[-11, -12]}
                style={{
                  backgroundColor: "rgb(168, 220, 209)",
                  color: "black",
                  transform: "scale(0.8)",
                  transformOrigin: "center",
                }}
              >
                <div style={{ position: "absolute", top: 0, right: 0 }}>
                  {mentor.isPreferredGroup && (
                    <Badge
                      count="C"
                      style={{
                        backgroundColor: "#3390C1",
                        color: "white",
                        marginRight: 2,
                        transform: "scale(0.8)",
                        transformOrigin: "center",
                        zIndex: 10,
                      }}
                      offset={[7, 1]}
                    />
                  )}
                </div>
                <div style={{ position: "absolute", top: 0, right: 0 }}>
                  {mentor.isTeacherPreferred && (
                    <Badge
                      count="UT"
                      style={{
                        backgroundColor: "#faad14",
                        color: "black",
                        transform: "scale(0.7)",
                        transformOrigin: "center",
                        zIndex: 10,
                      }}
                      offset={[-29, -22]}
                    />
                  )}
                </div>
                <div className="mentor-info-content">
                  <div className="mentor-info-left">
                    <Avatar
                      src={mentor.avatarUrl}
                      alt={mentor.username}
                      size={40}
                    />
                    <div>
                      <p>
                        <strong>{mentor.username}</strong>
                      </p>
                      <p style={{ fontSize: "12px", color: "#888" }}>
                        {mentor.email}
                      </p>
                      <Tooltip
                        title={`${mentor.currentLoad}/${mentor.maxLoad}`}
                      >
                        <Progress
                          percent={(mentor.currentLoad / mentor.maxLoad) * 100}
                          size="small"
                          status="active"
                          showInfo={false}
                          style={{
                            marginTop: 6,
                            marginLeft: "6px",
                            width: "86%",
                          }}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </Badge>
            </Tooltip>
          </div>
        ))}

      {/* Nút xác nhận mentor đã được gán */}
      {assignedMentors.length > 0 && (
        <Button
          style={{
            marginLeft: "91%",
            width: 25,
            height: 25,
            borderRadius: "30px",
          }}
          icon={<CheckOutlined />}
          onClick={handleConfirmMentor}
        ></Button>
      )}
    </div>
  );
};

const ProjectCardMain = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Lấy dữ liệu từ Redux
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
  } = useSelector((state) => state.matching);

  const teacherId = localStorage.getItem("userId");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Tải dữ liệu lớp học khi component được mount
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
        message.error("Lỗi khi tải dữ liệu lớp học.");
      }
      dispatch(setLoadingClasses(false));
    };

    loadData();
  }, [teacherId, dispatch]);

  const reloadProjectData = async () => {
    try {
      const projectResponse = await fetchProjectData(
        teacherId,
        selectedClassId
      );
      const projects = projectResponse.data.projects;
      dispatch(setProjectData(projects));
    } catch (error) {
      console.error("Error reloading project data:", error);
      message.error("Lỗi khi tải lại dữ liệu dự án.");
    }
  };

  // Xử lý khi chọn lớp học
  const handleClassChange = async (classId) => {
    dispatch(setSelectedClassId(classId));
    dispatch(setLoadingProjects(true));
    try {
      const projectResponse = await fetchProjectData(teacherId, classId);
      const projects = projectResponse.data.projects;
      dispatch(setProjectData(projects));

      // Khởi tạo assignedMentorsMap
      const initialAssignedMap = {};
      projects.forEach((project) => {
        initialAssignedMap[project._id] = [];
      });
      console.log("initialAssignedMap", initialAssignedMap);

      dispatch(setAssignedMentorsMap(initialAssignedMap));

      // Gợi ý mentor
      await fetchSuggestedMentors(classId, projects);
      message.success("Đã gợi ý thành công!");
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu dự án:", error);
      dispatch(setProjectData([]));
      message.error("Lỗi khi tải dữ liệu dự án.");
    }
    dispatch(setLoadingProjects(false));
  };

  // Hàm gợi ý mentor và cập nhật Redux
  const fetchSuggestedMentors = async (classId, projects) => {
    if (!classId) {
      message.warning("Vui lòng chọn lớp trước khi xem gợi ý.");
      return;
    }
    dispatch(setLoadingMentors(true));
    try {
      const mentorsResponse = await fetchMentorsTempMatching(
        classId,
        teacherId
      );
      const mentorData = {};

      mentorsResponse.data.forEach((matchingResult) => {
        const {
          groupId,
          mentorPreferred,
          teacherPreferredMentors,
          matchingMentors,
        } = matchingResult;
        const project = projects.find((p) => p.groupId === groupId);
        if (project) {
          const projectId = project._id;

          // Sắp xếp teacherPreferredMentors theo priority tăng dần
          const sortedTeacherPreferredMentors = (
            teacherPreferredMentors || []
          ).sort((a, b) => a.priority - b.priority);

          // Cập nhật mentorData
          mentorData[projectId] = {
            mentorPreferred: mentorPreferred || [],
            teacherPreferredMentors: sortedTeacherPreferredMentors,
            matchingMentors: matchingMentors || [],
          };

          // Tìm mentor đầu tiên dựa trên thứ tự ưu tiên
          let initialMentor = null;
          if (mentorPreferred && mentorPreferred.length > 0) {
            initialMentor = mentorPreferred[0];
          } else if (sortedTeacherPreferredMentors.length > 0) {
            initialMentor = sortedTeacherPreferredMentors[0];
          } else if (matchingMentors && matchingMentors.length > 0) {
            initialMentor = matchingMentors[0];
          }

          // Cập nhật assignedMentorsMap với mentor đầu tiên tìm được
          dispatch(
            updateAssignedMentorsMap({
              projectId,
              mentors: initialMentor ? [initialMentor] : [],
            })
          );
        }
      });

      dispatch(setMentorsData(mentorData));
      dispatch(setShowSuggestions(true));
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu mentor:", error);
      message.error("Không thể lấy danh sách mentor gợi ý.");
    }
    dispatch(setLoadingMentors(false));
  };

  // Xử lý khi kéo thả kết thúc
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && over.id.startsWith("project-")) {
      const projectId = over.id.replace("project-", "");
      const uniqueId = active.id;
      const mentorId = uniqueId.split("-").pop();

      const mentor =
        mentorsData[projectId]?.mentorPreferred?.find(
          (m) => m.mentorId === mentorId
        ) ||
        mentorsData[projectId]?.teacherPreferredMentors?.find(
          (m) => m.mentorId === mentorId
        ) ||
        mentorsData[projectId]?.matchingMentors?.find(
          (m) => m.mentorId === mentorId
        );

      if (mentor) {
        // Cập nhật assignedMentorsMap trong Redux
        dispatch(
          updateAssignedMentorsMap({
            projectId,
            mentors: [mentor], // Thay thế mentor hiện tại bằng mentor mới
          })
        );
      }
    }
  };

  // Xử lý khi nhấp vào xem chi tiết lựa chọn
  const handleViewDetailSelection = (projectId) => {
    navigate(`detailed-selection/${projectId}`, {
      state: {
        project: projectData.find((p) => p._id === projectId),
        mentors: mentorsData[projectId],
        assignedMentors: assignedMentorsMap[projectId],
      },
    });
  };

  const unmatchedProjects = projectData.filter((project) => !project.isMatched);

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
          <div
            className="class-select-container"
            style={{
              padding: "9px",
            }}
          >
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
                {classSummaries.map((classItem) => (
                  <Option key={classItem.classId} value={classItem.classId}>
                    {classItem.className}
                  </Option>
                ))}
              </Select>
            )}
          </div>

          <div className="button-group">
            <Button style={{ marginRight: 13 }}>
              Tổng số nhóm:{" "}
              {selectedClassId
                ? classSummaries
                    .find((cls) => cls.classId === selectedClassId)
                    ?.groupDetails.filter((grp) => grp.isProjectUpdated)
                    .length || 0
                : 0}
            </Button>
          </div>
        </div>

        <div
          className={`container-projects ${
            showSuggestions ? "single-column" : "grid-layout"
          }`}
        >
          {loadingProjects ? (
            <Spin />
          ) : unmatchedProjects.length > 0 ? (
            unmatchedProjects.map((project) => (
              <div
                className={`single-project-row ${
                  showSuggestions ? "suggestion-layout" : "grid-layout"
                }`}
                key={project._id}
              >
                <div className="project-card-wrapper">
                  <h6 className="main-title-suggest">Lựa Chọn Nhanh</h6>
                  <ProjectCard
                    project={project}
                    assignedMentors={assignedMentorsMap[project._id] || []}
                  />
                </div>

                {showSuggestions && mentorsData[project._id] && (
                  <div className="suggestions-and-drop-zone">
                    <div className="mentor-suggestions-wrapper">
                      <MentorSuggestionRow
                        title="Mentor Ưu Tiên Nhóm:"
                        mentors={mentorsData[project._id].mentorPreferred}
                        assignedMentors={assignedMentorsMap[project._id] || []}
                        projectId={project._id}
                        existingMentorIds={new Set()}
                        colorClass="mentor-preferred-card"
                        teacherPreferredMentors={
                          mentorsData[project._id].teacherPreferredMentors
                        }
                      />
                      <MentorSuggestionRow
                        title="Mentor Bạn Ưu Tiên:"
                        mentors={
                          mentorsData[project._id].teacherPreferredMentors
                        }
                        projectId={project._id}
                        assignedMentors={assignedMentorsMap[project._id] || []}
                        existingMentorIds={
                          new Set(
                            mentorsData[project._id].mentorPreferred.map(
                              (m) => m.mentorId
                            )
                          )
                        }
                        colorClass="teacher-preferred-card"
                        teacherPreferredMentors={
                          mentorsData[project._id].teacherPreferredMentors
                        }
                      />

                      <MentorSuggestionRow
                        title="Mentor Phù Hợp:"
                        mentors={mentorsData[project._id].matchingMentors}
                        assignedMentors={assignedMentorsMap[project._id] || []}
                        projectId={project._id}
                        existingMentorIds={
                          new Set([
                            ...mentorsData[project._id].mentorPreferred.map(
                              (m) => m.mentorId
                            ),
                            ...mentorsData[
                              project._id
                            ].teacherPreferredMentors.map((m) => m.mentorId),
                          ])
                        }
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
                        assignedMentorsMap[project._id]?.map((mentor) => ({
                          ...mentor,
                          isTeacherPreferred: mentorsData[
                            project._id
                          ].teacherPreferredMentors.some(
                            (teacherPreferred) =>
                              teacherPreferred.mentorId === mentor.mentorId
                          ),
                        })) || []
                      }
                      mentors={mentorsData[project._id]}
                      activeId={activeId}
                      onMentorAssigned={reloadProjectData}
                    />
                    <h6 className="view-more-suggest">
                      <p
                        style={{ cursor: "pointer" }}
                        onClick={() => handleViewDetailSelection(project._id)}
                      >
                        <SelectOutlined /> Lựa Chọn Chi Tiết
                      </p>
                    </h6>
                  </div>
                )}
              </div>
            ))
          ) : selectedClassId ? (
            <p>Lớp đã ghép Mentor</p>
          ) : (
            <p>Vui lòng chọn một lớp để xem dự án.</p>
          )}
        </div>
      </div>
    </DndContext>
  );
};

export default ProjectCardMain;
