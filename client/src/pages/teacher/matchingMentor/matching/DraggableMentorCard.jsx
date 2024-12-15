// src/components/ProjectCardMain/DraggableMentorCard.jsx
import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Tooltip, Badge, Avatar } from "antd";
import { CSS } from "@dnd-kit/utilities";
import { CheckOutlined, StarFilled } from "@ant-design/icons";
import PropTypes from "prop-types";

const DraggableMentorCard = ({
  mentor,
  projectId,
  colorClass,
  isTeacherPreferred,
}) => {
  const uniqueId = `${projectId}-${String(mentor.mentorId)}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
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
  const toggleDetails = () => setShowDetails(!showDetails);

  const specialtiesList =
    mentor.matchedSpecialties?.map((specialty, index) => (
      <p key={index} style={{ margin: 0 }}>
        {specialty.name}
      </p>
    )) || [];

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
              ? mentor.matchedSpecialties?.length > 0
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
                count={
                  !isDragging ? (
                    <StarFilled
                      style={{ color: "#ff9800", fontSize: "20px" }}
                    />
                  ) : (
                    0
                  )
                }
                style={{
                  backgroundColor: "#f5f5f5",
                  color: "white",
                  marginRight: 2,
                  transform: "scale(0.7)",
                  transformOrigin: "center",
                  zIndex: 10,
                  borderRadius: 30,
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
      </div>
    </Tooltip>
  );
};

DraggableMentorCard.propTypes = {
  mentor: PropTypes.object.isRequired,
  projectId: PropTypes.string.isRequired,
  colorClass: PropTypes.string,
  isTeacherPreferred: PropTypes.bool,
};

DraggableMentorCard.defaultProps = {
  colorClass: "",
  isTeacherPreferred: false,
};

export default DraggableMentorCard;
