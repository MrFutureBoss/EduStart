import React, { useState } from "react";
import { Card, Tag, Space, Tooltip, Button } from "antd";
import { StarFilled } from "@ant-design/icons"; // Import biểu tượng ngôi sao
import "../teacherCSS/ProjectCard.css";

const ProjectCardMatched = ({
  project,
  style,
  className,
  onSelect = () => {},
  group,
  isFavorite,
  mentor,
  professions,
  specialties,
}) => {
  // State để điều khiển trạng thái mở rộng thẻ card
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const [showAllProfessions, setShowAllProfessions] = useState(false);

  // Hàm để chuyển đổi trạng thái mở rộng
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

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
        className={`project-card-1 custom-width ${
          isExpanded ? "expanded" : ""
        }`}
        bordered={false}
        hoverable
        style={{ ...style, height: isExpanded ? "fit-content" : "" }}
      >
        {/* Hiển thị tên dự án */}
        <h2 className="project-title">
          {project.name || project?.groupId?.projectId?.name}
        </h2>

        {/* Nội dung chi tiết chỉ hiển thị khi mở rộng */}
        {isExpanded && (
          <div>
            <p className="project-description">
              Mô tả:{" "}
              {project.description || project?.groupId?.projectId?.description}
            </p>

            <div className="project-specialties">
              <Space size={[0, 8]} wrap>
                {project.projectCategory?.specialtyIds?.map((specialty) => (
                  <Tooltip title={specialty.name} key={specialty._id}>
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

            <div className="matched-mentor">
              <p className="p-mentor-matched">
                <strong>Mentor đã chọn:</strong>
              </p>

              {mentor && (
                <div>
                  <p className="p-mentor-matched">
                    <strong>Tên:</strong> {mentor.username}
                  </p>
                  <p className="p-mentor-matched">
                    <strong>Email:</strong> {mentor.email}
                  </p>
                  <p className="p-mentor-matched">
                    <strong>Số điện thoại:</strong> {mentor.phoneNumber}
                  </p>
                  <p className="p-mentor-matched">
                    <strong>Danh sách lĩnh vực:</strong>
                    <span>
                      {professions
                        ?.slice(0, showAllProfessions ? professions.length : 2)
                        .join(", ")}
                      {professions?.length > 2 && (
                        <button
                          onClick={() =>
                            setShowAllProfessions(!showAllProfessions)
                          }
                          style={{
                            marginLeft: "8px",
                            color: "blue",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                          }}
                        >
                          {showAllProfessions ? "Ẩn bớt" : "Xem thêm"}
                        </button>
                      )}
                    </span>
                  </p>
                  <p className="p-mentor-matched">
                    <strong>Danh sách chuyên môn:</strong>
                    <span>
                      {specialties
                        ?.slice(0, showAllSpecialties ? specialties.length : 1)
                        .join(", ")}
                      {specialties?.length > 1 && (
                        <button
                          onClick={() =>
                            setShowAllSpecialties(!showAllSpecialties)
                          }
                          style={{
                            marginLeft: "8px",
                            color: "blue",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                          }}
                        >
                          {showAllSpecialties ? "Ẩn bớt" : "Xem thêm"}
                        </button>
                      )}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nút mở rộng hoặc thu gọn */}
        <Button
          type="link"
          onClick={toggleExpand}
          style={{ marginLeft: "3px" }}
        >
          {isExpanded ? "Thu gọn" : "Xem chi tiết"}
        </Button>
      </Card>
    </div>
  );
};

export default ProjectCardMatched;
