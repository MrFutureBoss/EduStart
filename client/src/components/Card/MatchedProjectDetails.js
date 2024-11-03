// MatchedProjectDetails.js
import React from "react";
import { Typography, Tag, Space, Card } from "antd";
import ProjectCard from "../../pages/teacher/matchingMentor/ProjectCard";
import "../../pages/teacher/teacherCSS/MatchedProjectCard.css";

const statusColors = {
  Pending: "orange",
  Accepted: "green",
  Active: "cyan",
};

const MatchedProjectDetails = ({ matchedData }) => (
  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
    {/* Thẻ hiển thị trạng thái */}
    {matchedData.status && (
      <Tag
        color={statusColors[matchedData.status]}
        style={{ fontSize: "1rem", padding: "4px 12px" }}
      >
        Trạng thái: {matchedData.status}
      </Tag>
    )}

    {/* ProjectCard */}
    <ProjectCard
      style={{ width: "100%", marginLeft: 1 }}
      project={matchedData}
      className="always-hover"
    />

    {/* Mentor Details Card */}
    <div
      className="elevated-card"
      style={{
        position: "absolute",
        bottom: 84,
        left: 631,
        boxShadow: "rgb(135, 186, 207) 0px 2px 6px",
        borderRadius: 21,
        border: "none",
        backgroundColor: "#c2e1eb",
        padding: 22,
      }}
    >
      <strong
        style={{
          position: "absolute",
          top: -19,
          left: 21,
          fontSize: "0.8rem",
          padding: "4px 10px",
          boxShadow: "0 2px 6px #87bacf",
          backgroundColor: "#62b6cb",
          fontWeight: "bold",
          border: "none",
          color: "#f0f8fa",
          borderRadius: "12px",
        }}
      >
        Mentor Đã Chọn
      </strong>
      <div style={{ borderRadius: 17, padding: 20, backgroundColor: "white" }}>
        <Card.Meta
          description={
            <>
              <p style={{ marginBottom: 2 }}>
                <strong>Tên: </strong>
                {matchedData?.mentorId?.username}
              </p>
              <p style={{ marginBottom: 2 }}>
                <strong>Email: </strong>
                {matchedData?.mentorId?.email}
              </p>
              <p style={{ marginBottom: 2 }}>
                <strong>Số điện thoại: </strong>
                {matchedData?.mentorId?.phoneNumber}
              </p>
            </>
          }
        />
      </div>
    </div>
  </Space>
);

export default MatchedProjectDetails;
