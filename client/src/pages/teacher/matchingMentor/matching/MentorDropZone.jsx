// src/components/ProjectCardMain/MentorDropZone.jsx
import React, { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Tag, Tooltip, Badge, Avatar, Progress, Button, message } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import { assignMentorToProject } from "../../../../api";

const MentorDropZone = ({
  projectId,
  groupId,
  assignedMentors,
  mentors,
  activeId,
  onMentorAssigned,
  teacherId,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `project-${projectId}`,
  });
  console.log("mentors,", mentors);

  const [draggedMentor, setDraggedMentor] = useState(null);
  console.log("draggedMentor", draggedMentor);

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
        const isTeacherPreferred = mentors?.teacherPreferredMentors?.some(
          (teacherMentor) => teacherMentor.mentorId === mentorId
        );
        setDraggedMentor({ ...mentor, isTeacherPreferred });
      }
    } else {
      setDraggedMentor(null);
    }
  }, [isOver, activeId, mentors]);

  const handleConfirmMentor = () => {
    const mentor = assignedMentors[0];
    if (mentor) {
      assignMentorToProject(groupId, mentor.mentorId, teacherId)
        .then(() => {
          message.success("Gán mentor thành công!");
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
        Mentor Được Đề Xuất
      </Tag>
      {isOver && draggedMentor && (
        <div className="mentor-info-card preview-card">
          <Tooltip title="Mentor đang được kéo vào" color="#faad14">
            <Badge
              showZero
              count={
                draggedMentor.matchedSpecialties?.length > 0
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
                {draggedMentor.isPreferredProject && (
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
                  mentor.matchedSpecialties?.length > 0
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
                  {mentor.isPreferredProject && (
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

      {assignedMentors.length > 0 && (
        <Tooltip title="Lưu gợi ý">
          <Button
            className="button-select-mentor-not-matched"
            style={{
              marginLeft: "91%",
              width: 25,
              height: 25,
              borderRadius: "30px",
            }}
            icon={<CheckOutlined />}
            onClick={handleConfirmMentor}
          ></Button>
        </Tooltip>
      )}
    </div>
  );
};

MentorDropZone.propTypes = {
  projectId: PropTypes.string.isRequired,
  groupId: PropTypes.string.isRequired,
  assignedMentors: PropTypes.array.isRequired,
  mentors: PropTypes.object.isRequired,
  activeId: PropTypes.string,
  onMentorAssigned: PropTypes.func,
  teacherId: PropTypes.string.isRequired,
};

MentorDropZone.defaultProps = {
  activeId: null,
  onMentorAssigned: null,
};

export default MentorDropZone;
