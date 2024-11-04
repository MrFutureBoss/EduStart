// ProjectCard.js
import React from "react";
import { Card, Tag, Space } from "antd";
import "../teacherCSS/ProjectCard.css";

const ProjectCard = ({ project, style, className }) => {
  return (
    <div className={`project-outer-container ${className}`}>
      {/* Thẻ Tag cho professions nằm ở bên ngoài viền của Card */}
      <div className="project-tag-container">
        {project.projectCategory?.professionId?.map((profession) => (
          <Tag key={profession._id} className="tag-overlay">
            {profession.name}
          </Tag>
        ))}
      </div>

      {/* Thẻ Card chính */}
      <Card
        className="project-card custom-width"
        bordered={false}
        hoverable
        style={style}
      >
        <div className="go-corner">
          <div className="go-arrow"></div>
        </div>

        <h2 className="project-title">
          {project.name || project?.groupId?.projectId?.name}
        </h2>
        <p className="project-description">
          {project.description || project?.groupId?.projectId?.description}
        </p>

        <div className="project-specialties">
          <Space size={[0, 8]} wrap>
            {project.projectCategory?.specialtyIds?.map((specialty) => (
              <Tag className="project-specialties-tag" key={specialty._id}>
                {specialty.name}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ProjectCard;
