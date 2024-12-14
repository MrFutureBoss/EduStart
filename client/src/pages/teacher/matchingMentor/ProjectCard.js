// ProjectCard.js
import React from "react";
import { Card, Tag, Space, Tooltip } from "antd";
import "../teacherCSS/ProjectCard.css";
import { StarFilled } from "@ant-design/icons"; // Import biểu tượng ngôi sao

const ProjectCard = ({
  project,
  style,
  className,
  onSelect = () => {},
  group,
  isFavorite,
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

      {/* Biểu tượng ngôi sao yêu thích */}
      {isFavorite && (
        <div className="favorite-icon">
          <StarFilled style={{ color: "#ff9800", fontSize: "20px" }} />
        </div>
      )}
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
            {project.projectCategory?.specialtyIds
              ?.slice(0, 2) // Hiển thị tối đa 2 chuyên môn
              .map((specialty) => (
                <Tooltip title={specialty.name} key={specialty._id}>
                  <Tag
                    className={`project-specialties-tag ${className}`}
                    key={specialty._id}
                  >
                    {specialty.name}
                  </Tag>
                </Tooltip>
              ))}
            {project.projectCategory?.specialtyIds?.length > 2 && (
              <Tooltip
                title={
                  <div>
                    {project.projectCategory.specialtyIds
                      .slice(2) // Lấy danh sách chuyên môn còn lại
                      .map((specialty) => (
                        <div key={specialty._id}>{specialty.name}</div>
                      ))}
                  </div>
                }
              >
                <Tag
                  className={`project-specialties-tag ${className}`}
                  key="more-specialties"
                >
                  +{project.projectCategory.specialtyIds.length - 2}
                </Tag>
              </Tooltip>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ProjectCard;
