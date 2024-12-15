import React, { useState } from "react";
import { Card, Avatar, Button, Progress, Tag } from "antd";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import "../teacherCSS/MentorCard.css";

const { Meta } = Card;

const MentorCard = ({
  mentor,
  onMoveToSelected,
  onChangePosition,
  isSelected,
  index,
  showMenu,
  setHasChanges,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleSelectPriority = () => {
    onMoveToSelected(mentor);
    setHasChanges(true);
  };

  const handleChangePriority = () => {
    onChangePosition(mentor);
    setHasChanges(true);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Tính toán tỷ lệ nhóm hiện tại so với tối đa
  const loadPercentage = (mentor.currentLoad / mentor.maxLoad) * 100;

  // Xác định màu sắc cho Tag dựa trên priority
  const getTagColor = (priority) => {
    switch (priority) {
      case 3:
        return "#EEC900";
      case 2:
        return "#9ACD32";
      case 4:
        return "#5F9EA0";
      case 1:
        return "#FF8C00";
      case 5:
        return "FF82AB";
      default:
        return "geekblue";
    }
  };

  return (
    <Card
      hoverable
      className="custom-mentor-card"
      bodyStyle={{ padding: "8px" }}
    >
      <div className="mentor-card-content">
        <div className="mentor-card-left">
          <Meta
            avatar={
              <Avatar
                className="avatar-mentor"
                src={mentor.mentorId.avatar || "default-avatar.png"}
              />
            }
            title={
              <div style={{ display: "flex", alignItems: "center" }}>
                {mentor.mentorId.username}
                {!isSelected && mentor.priority && (
                  <Tag
                    color={getTagColor(mentor.priority)}
                    style={{ marginLeft: "8px" }}
                  >
                    Ưu tiên {mentor.priority}
                  </Tag>
                )}
              </div>
            }
            description={<span>{mentor.mentorId.email}</span>}
          />
        </div>

        <div className="mentor-card-right">
          {showMenu && (
            <>
              {!isSelected ? (
                <Button
                  type="default"
                  size="small"
                  onClick={handleSelectPriority}
                  style={{
                    marginRight: "8px",
                    backgroundColor: "#62b6cb",
                    color: "white",
                    fontWeight: 500,
                  }}
                >
                  Chọn độ ưu tiên
                </Button>
              ) : (
                <Button
                  type="default"
                  size="small"
                  onClick={handleChangePriority}
                  style={{
                    marginRight: "8px",
                    backgroundColor: "#62b6cb",
                    color: "white",
                    fontWeight: 500,
                  }}
                >
                  Thay đổi độ ưu tiên
                </Button>
              )}
            </>
          )}

          {/* Nút mở rộng/thu gọn chỉ hiển thị nếu showMenu là true */}
          {showMenu &&
            (!expanded ? (
              <Button
                type="link"
                style={{ marginRight: -6.4, marginTop: -4 }}
                className="expand-btn"
                onClick={toggleExpand}
                icon={<DownOutlined />}
              />
            ) : (
              <Button
                type="link"
                style={{ marginRight: -6.4, marginTop: -13 }}
                className="expand-btn"
                onClick={toggleExpand}
                icon={<UpOutlined />}
              />
            ))}
        </div>
      </div>

      {expanded && (
        <div className="mentor-details">
          <div className="mentor-load-info">
            <strong> Số điện thoại: </strong>
            {mentor.mentorId.phoneNumber}
          </div>
          <div className="mentor-load-info">
            <strong>Nhóm đã nhận:</strong> {mentor.currentLoad}/{mentor.maxLoad}
            <Progress
              percent={loadPercentage}
              size="small"
              status={loadPercentage === 100 ? "exception" : "active"}
              showInfo={false}
              strokeColor={loadPercentage === 100 ? "#ff4d4f" : "#1890ff"}
              style={{ marginTop: "10px" }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

MentorCard.propTypes = {
  mentor: PropTypes.object.isRequired,
  onMoveToSelected: PropTypes.func.isRequired,
  onChangePosition: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  index: PropTypes.number,
  showMenu: PropTypes.bool,
  setHasChanges: PropTypes.func.isRequired, // Thêm propType cho setHasChanges
};

MentorCard.defaultProps = {
  onChangePosition: () => {},
  isSelected: false,
  index: undefined,
  showMenu: true,
  setHasChanges: () => {},
};

export default MentorCard;
