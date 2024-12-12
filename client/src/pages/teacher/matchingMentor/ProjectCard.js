// ProjectCard.js
import React from "react";
import { Card, Tag, Space, Tooltip } from "antd";
import "../teacherCSS/ProjectCard.css";

const ProjectCard = ({
  project,
  style,
  className,
  onSelect = () => {},
  group,
}) => {
  return (
    <div className={`project-outer-container ${className}`}>
      {/* Thẻ Tag cho professions nằm ở bên ngoài viền của Card */}
      <div className="project-tag-container">
        {group?.className && (
          <Tag className="tag-overlay">{group.className}</Tag>
        )}
        {group?.groupName && (
          <Tag className="tag-overlay">{group.groupName}</Tag>
        )}
      </div>

      {/* Thẻ Card chính */}
      <Card
        className="project-card custom-width"
        bordered={false}
        hoverable
        style={style}
        onClick={() => onSelect(project._id)}
      >
        <div className="go-corner">
          <div className="go-arrow"></div>
        </div>

        <h2 className="project-title">
          Tên dự án: {project.name || project?.groupId?.projectId?.name}
        </h2>
        <p className="project-description">
          Mô tả:{" "}
          {project.description || project?.groupId?.projectId?.description}
        </p>

        <div className="project-specialties">
          <Space size={[0, 8]} wrap>
            {project.projectCategory?.specialtyIds?.map((specialty) => (
              <Tooltip title="Chuyên môn" key={specialty._id}>
                <Tag
                  className={`project-specialties-tag ${className}`}
                  key={specialty._id}
                >
                  {specialty.name}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ProjectCard;
