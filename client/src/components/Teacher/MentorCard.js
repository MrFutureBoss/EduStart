// src/components/Teacher/MentorCard.js
import React from "react";
import { Card, Avatar, Button, Tooltip, Progress } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import "./teacherCSS/MentorCard.css"; // Thêm file CSS riêng

const { Meta } = Card;

const MentorCard = ({ mentor, onSelect, onDeselect, isSelected }) => {
  const handleProfileClick = () => {
    // Điều hướng sang trang profile chi tiết của mentor (có thể sử dụng React Router)
    window.location.href = `/mentor-profile/${mentor.mentorId._id}`;
  };

  // Tính toán tỷ lệ nhóm hiện tại so với tối đa
  const loadPercentage = (mentor.currentLoad / mentor.maxLoad) * 100;

  return (
    <Card
      hoverable
      className={`custom-mentor-card ${isSelected ? "selected" : ""}`}
    >
      <Meta
        title={
          <div className="mentor-title">
            <div className="mentor-name">{mentor.mentorId.username}</div>
            {/* Nút xem profile */}
            <Tooltip title="Xem thông tin chi tiết">
              <InfoCircleOutlined
                onClick={handleProfileClick}
                style={{
                  fontSize: "18px",
                  color: "#1890ff",
                  cursor: "pointer",
                }}
              />
            </Tooltip>
          </div>
        }
        description={
          <>
            <div className="mentor-email">{mentor.mentorId.email}</div>
            <div className="mentor-load-info">
              <strong>Nhóm đã nhận:</strong> {mentor.currentLoad}/
              {mentor.maxLoad}
              <Progress
                percent={loadPercentage}
                size="small"
                status={loadPercentage === 100 ? "exception" : "active"}
                showInfo={false}
                strokeColor={loadPercentage === 100 ? "#ff4d4f" : "#1890ff"}
                style={{ marginTop: "10px" }}
              />
            </div>
          </>
        }
      />
      <Button
        type="primary"
        style={{ marginTop: "20px", width: "100%" }}
        onClick={() => (isSelected ? onDeselect(mentor) : onSelect(mentor))}
      >
        {isSelected ? "Bỏ chọn" : "Chọn"}
      </Button>
    </Card>
  );
};

MentorCard.propTypes = {
  mentor: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired, // Hàm xử lý chọn mentor
  onDeselect: PropTypes.func.isRequired, // Hàm xử lý bỏ chọn mentor
  isSelected: PropTypes.bool.isRequired, // Kiểm tra mentor đã chọn hay chưa
};

export default MentorCard;
