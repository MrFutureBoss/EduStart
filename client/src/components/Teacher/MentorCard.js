import React, { useState } from "react";
import { Card, Avatar, Dropdown, Menu, Button, Progress } from "antd";
import { EllipsisOutlined, UpOutlined, DownOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import "./teacherCSS/MentorCard.css";

const { Meta } = Card;

const MentorCard = ({
  mentor,
  onMoveToSelected,
  onChangePosition,
  isSelected,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleMenuClick = ({ key }) => {
    if (key === "select") {
      onMoveToSelected(mentor);
    } else if (key === "view") {
      setExpanded(true);
    } else if (key === "changePosition") {
      onChangePosition(mentor);
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      {!isSelected && <Menu.Item key="select">Chọn vào vị trí</Menu.Item>}
      {isSelected && (
        <Menu.Item key="changePosition">Thay đổi vị trí</Menu.Item>
      )}
    </Menu>
  );

  // Tính toán tỷ lệ nhóm hiện tại so với tối đa
  const loadPercentage = (mentor.currentLoad / mentor.maxLoad) * 100;

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
              <Avatar src={mentor.mentorId.avatar || "default-avatar.png"} />
            }
            title={mentor.mentorId.username}
          />
        </div>

        <div className="mentor-card-right">
          <Dropdown overlay={menu} trigger={["click"]}>
            <EllipsisOutlined className="mentor-card-menu" />
          </Dropdown>

          {!expanded ? (
            <Button
              type="link"
              style={{ marginRight: -6.4, marginTop: -13 }}
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
          )}
        </div>
      </div>

      {expanded && (
        <div className="mentor-details">
          <div className="mentor-email">{mentor.mentorId.email}</div>
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
};

MentorCard.defaultProps = {
  onChangePosition: () => {},
  isSelected: false,
  index: undefined,
};

export default MentorCard;
