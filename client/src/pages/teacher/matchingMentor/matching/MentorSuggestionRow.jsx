// src/components/ProjectCardMain/MentorSuggestionRow.jsx
import React, { useState } from "react";
import { Button } from "antd";
import PropTypes from "prop-types";
import DraggableMentorCard from "./DraggableMentorCard";

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

  // Ensure existingMentorIds is a Set of strings
  const uniqueMentors = (mentors || []).filter(
    (mentor) =>
      !existingMentorIds.has(String(mentor.mentorId)) &&
      !assignedMentorIds.has(String(mentor.mentorId))
  );

  if (uniqueMentors.length === 0) return null;

  const displayedMentors = showAll
    ? uniqueMentors
    : uniqueMentors.slice(0, maxDisplay);
  const handleToggleShowAll = () => setShowAll(!showAll);

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
              (teacherMentor) =>
                String(teacherMentor.mentorId) === String(mentor.mentorId)
            )}
          />
        ))}
      </div>
    </div>
  );
};

MentorSuggestionRow.propTypes = {
  title: PropTypes.string.isRequired,
  mentors: PropTypes.array.isRequired,
  projectId: PropTypes.string.isRequired,
  assignedMentors: PropTypes.array,
  existingMentorIds: PropTypes.instanceOf(Set).isRequired,
  colorClass: PropTypes.string,
  teacherPreferredMentors: PropTypes.array,
};

MentorSuggestionRow.defaultProps = {
  assignedMentors: [],
  colorClass: "",
  teacherPreferredMentors: [],
};

export default MentorSuggestionRow;
