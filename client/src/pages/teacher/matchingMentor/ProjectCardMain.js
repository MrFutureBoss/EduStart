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
  setMatchedClasses,
  setNotMatchedClasses,
} from "../../../redux/slice/ClassSlice";
import ProjectCard from "./ProjectCard";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
  pointerWithin,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CheckOutlined } from "@ant-design/icons";

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
    transition: "transform 0.15s ease", // Giảm thời gian chuyển động
    opacity: isDragging ? 0.8 : 1, // Để giảm độ mờ khi kéo thả
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
    <Tooltip color="#a8dcd1" title={specialtiesList}>
      <Badge
        count={!isDragging ? mentor.matchedSpecialties.length : 0}
        offset={[-6, 2]}
        style={{
          backgroundColor: "#a8dcd1",
          color: "black",
          transform: "scale(0.7)",
          transformOrigin: "center",
        }}
      >
        {isTeacherPreferred ? (
          <Badge
            count={!isDragging ? "UT" : 0}
            style={{
              backgroundColor: "#faad14",
              color: "white",
              transform: "scale(0.6)",
              transformOrigin: "center",
            }}
            offset={[-20, -2]}
          >
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
          </Badge>
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

  const updatedExistingMentorIds = new Set([
    ...existingMentorIds,
    ...uniqueMentors.map((mentor) => mentor.mentorId),
  ]);

  const displayedMentors = showAll
    ? uniqueMentors
    : uniqueMentors.slice(0, maxDisplay);

  const handleToggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <div className="mentor-suggestion-row">
      <div className="mentor-cards-row">
        {displayedMentors.map((mentor) => (
          <DraggableMentorCard
            key={mentor.mentorId}
            mentor={mentor}
            projectId={projectId}
            colorClass={colorClass}
            isTeacherPreferred={title === "Mentor Ưu Tiên Giáo Viên:"}
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

// Component Drop Zone cho mỗi Project
const MentorDropZone = ({
  projectId,
  assignedMentors,
  setAssignedMentors,
  mentors,
  activeId,
  isTeacherPreferred,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `project-${projectId}`,
  });
  console.log("isTeacherPreferred", isTeacherPreferred);

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
      setDraggedMentor(mentor);
    } else {
      setDraggedMentor(null);
    }
  }, [isOver, activeId, mentors]);

  // Xử lý việc gán mentor khi nhấn nút xác nhận
  const handleConfirmMentor = () => {
    const mentor = assignedMentors[0];
    if (mentor) {
      assignMentorToProject(projectId, mentor.mentorId)
        .then(() => {
          message.success("Gán mentor thành công!");
        })
        .catch((error) => {
          console.error("Lỗi khi gán mentor:", error);
          message.error("Gán mentor thất bại.");
        });
    }
  };

  // Style cho ô nhận (drop zone)
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
                      (draggedMentor.currentLoad / draggedMentor.maxLoad) * 100
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
            <Tooltip title="Mentor đã được gán" color="#a3d4e0">
              <Badge
                count={mentor.matchedSpecialties.length}
                offset={[-6, 2]}
                style={{
                  backgroundColor: "#a8dcd1",
                  color: "black",
                  transform: "scale(0.7)",
                  transformOrigin: "center",
                }}
              >
                {mentor.isTeacherPreferred ? (
                  <Badge
                    count="UT"
                    offset={[-20, -2]}
                    style={{
                      backgroundColor: "#faad14",
                      color: "white",
                      transform: "scale(0.6)",
                      transformOrigin: "center",
                    }}
                  >
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
                              percent={
                                (mentor.currentLoad / mentor.maxLoad) * 100
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
                ) : (
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
                            percent={
                              (mentor.currentLoad / mentor.maxLoad) * 100
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
                )}
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
  const { classSummaries } = useSelector((state) => state.class);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [projectData, setProjectData] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [mentors, setMentors] = useState({});
  const teacherId = localStorage.getItem("userId");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [assignedMentorsMap, setAssignedMentorsMap] = useState({});
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    const loadData = async () => {
      setLoadingClasses(true);
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
      }
      setLoadingClasses(false);
    };

    loadData();
  }, [teacherId, dispatch]);

  const handleClassChange = async (classId) => {
    setSelectedClassId(classId);
    setLoadingProjects(true);
    try {
      const projectResponse = await fetchProjectData(teacherId, classId);
      const projects = projectResponse.data.projects;
      setProjectData(projects);

      const initialAssignedMap = {};
      projects.forEach((project) => {
        initialAssignedMap[project._id] = [];
      });
      setAssignedMentorsMap(initialAssignedMap);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu dự án:", error);
      setProjectData([]);
    }
    setLoadingProjects(false);
  };

  const fetchSuggestedMentors = async () => {
    if (!selectedClassId) {
      message.warning("Vui lòng chọn lớp trước khi xem gợi ý.");
      return;
    }
    setLoadingMentors(true);
    try {
      const mentorsResponse = await fetchMentorsTempMatching(
        selectedClassId,
        teacherId
      );

      const mentorData = {};
      const initialAssignedMap = {}; // Tạo assigned map tạm thời để cập nhật

      mentorsResponse.data.forEach((matchingResult) => {
        const {
          groupId,
          mentorPreferred,
          teacherPreferredMentors,
          matchingMentors,
        } = matchingResult;

        const project = projectData.find((p) => p.groupId === groupId);
        if (project) {
          const projectId = project._id;

          // Sắp xếp teacherPreferredMentors theo 'priority' tăng dần
          const sortedTeacherPreferredMentors = teacherPreferredMentors.sort(
            (a, b) => a.priority - b.priority
          );

          // Cập nhật dữ liệu mentor cho project
          mentorData[projectId] = {
            mentorPreferred,
            teacherPreferredMentors: sortedTeacherPreferredMentors,
            matchingMentors,
          };

          // Tìm mentor đầu tiên dựa trên thứ tự ưu tiên và thêm vào initialAssignedMap
          let initialMentor = null;
          if (mentorPreferred && mentorPreferred.length > 0) {
            initialMentor = mentorPreferred[0];
          } else if (
            sortedTeacherPreferredMentors &&
            sortedTeacherPreferredMentors.length > 0
          ) {
            initialMentor = sortedTeacherPreferredMentors[0];
          } else if (matchingMentors && matchingMentors.length > 0) {
            initialMentor = matchingMentors[0];
          }

          // Cập nhật initialAssignedMap với mentor đầu tiên tìm được
          initialAssignedMap[projectId] = initialMentor ? [initialMentor] : [];
        }
      });

      setMentors(mentorData);
      setAssignedMentorsMap(initialAssignedMap); // Cập nhật map tạm thời với mentor đầu tiên cho từng project
      setShowSuggestions(true);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu mentor:", error);
      message.error("Không thể lấy danh sách mentor gợi ý.");
    }
    setLoadingMentors(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && over.id.startsWith("project-")) {
      const projectId = over.id.replace("project-", "");
      const uniqueId = active.id;
      const mentorId = uniqueId.split("-").pop();

      const mentor =
        mentors[projectId]?.mentorPreferred?.find(
          (m) => m.mentorId === mentorId
        ) ||
        mentors[projectId]?.teacherPreferredMentors?.find(
          (m) => m.mentorId === mentorId
        ) ||
        mentors[projectId]?.matchingMentors?.find(
          (m) => m.mentorId === mentorId
        );

      if (mentor) {
        setAssignedMentorsMap((prevMap) => ({
          ...prevMap,
          [projectId]: [mentor], // Thay thế mentor hiện tại bằng mentor mới
        }));
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={(event) => {
        setActiveId(null);
        handleDragEnd(event);
      }}
    >
      <div className="main-project-container">
        <div className="header-bar">
          <div className="class-select-container">
            <label style={{ marginRight: 8 }}>Chọn lớp:</label>
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
                style={{ width: 200 }}
                value={selectedClassId}
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
            <Button style={{ marginRight: 8 }}>
              Tổng số nhóm:{" "}
              {selectedClassId
                ? classSummaries
                    .find((cls) => cls.classId === selectedClassId)
                    ?.groupDetails.filter((grp) => grp.isProjectUpdated)
                    .length || 0
                : 0}
            </Button>
            <Button type="default" onClick={fetchSuggestedMentors}>
              Gợi ý ghép nhóm
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
          ) : projectData.length > 0 ? (
            projectData.map((project) => (
              <div
                className={`single-project-row ${
                  showSuggestions ? "suggestion-layout" : "grid-layout"
                }`}
                key={project._id}
              >
                <div className="project-card-wrapper">
                  <ProjectCard
                    project={project}
                    assignedMentors={assignedMentorsMap[project._id] || []}
                  />
                </div>

                {showSuggestions && mentors[project._id] && (
                  <div className="suggestions-and-drop-zone">
                    <div className="mentor-suggestions-wrapper">
                      <MentorSuggestionRow
                        title="Mentor Ưu Tiên Nhóm:"
                        mentors={mentors[project._id].mentorPreferred}
                        assignedMentors={assignedMentorsMap[project._id] || []}
                        projectId={project._id}
                        existingMentorIds={new Set()}
                        colorClass="mentor-preferred-card"
                      />
                      <MentorSuggestionRow
                        title="Mentor Ưu Tiên Giáo Viên:"
                        mentors={mentors[project._id].teacherPreferredMentors}
                        projectId={project._id}
                        assignedMentors={assignedMentorsMap[project._id] || []} // Đảm bảo truyền assignedMentors
                        existingMentorIds={
                          new Set(
                            mentors[project._id].mentorPreferred.map(
                              (m) => m.mentorId
                            )
                          )
                        }
                        colorClass="teacher-preferred-card"
                      />

                      <MentorSuggestionRow
                        title="Mentor Phù Hợp:"
                        mentors={mentors[project._id].matchingMentors}
                        assignedMentors={assignedMentorsMap[project._id] || []}
                        projectId={project._id}
                        existingMentorIds={
                          new Set([
                            ...mentors[project._id].mentorPreferred.map(
                              (m) => m.mentorId
                            ),
                            ...mentors[project._id].teacherPreferredMentors.map(
                              (m) => m.mentorId
                            ),
                          ])
                        }
                        colorClass="matching-mentors-card"
                      />
                    </div>
                    <MentorDropZone
                      projectId={project._id}
                      assignedMentors={
                        assignedMentorsMap[project._id]?.map((mentor) => ({
                          ...mentor,
                          isTeacherPreferred: mentors[
                            project._id
                          ].teacherPreferredMentors.some(
                            (teacherPreferred) =>
                              teacherPreferred.mentorId === mentor.mentorId
                          ),
                        })) || []
                      }
                      setAssignedMentors={(mentors) => {
                        setAssignedMentorsMap((prevMap) => ({
                          ...prevMap,
                          [project._id]: mentors,
                        }));
                      }}
                      mentors={mentors[project._id]}
                      activeId={activeId}
                    />
                  </div>
                )}
              </div>
            ))
          ) : selectedClassId ? (
            <p>Không có dự án nào cho lớp này.</p>
          ) : (
            <p>Vui lòng chọn một lớp để xem dự án.</p>
          )}
        </div>
      </div>
    </DndContext>
  );
};

export default ProjectCardMain;
