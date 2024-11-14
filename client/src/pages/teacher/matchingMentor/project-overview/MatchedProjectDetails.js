// MatchedProjectDetails.js
import React from "react";
import { Tag, Space, Card, Button } from "antd";
import { useNavigate } from "react-router-dom";
import ProjectCard from "../ProjectCard";
import "../../teacherCSS/MatchedProjectCard.css";
import { useSelector } from "react-redux";

const statusColors = {
  Pending: "#700576",
  Planning: "#108ee9",
  Changing: "#108ee9",
  Accepted: "#04724d",
  InProgress: "#FFB85C",
  Decline: "#963638",
};
const statusTexts = {
  Pending: "Chờ Mentor chấp nhận",
  Accepted: "Mentor đã chấp nhận",
  InProgress: "Chưa chọn Mentor cho nhóm",
  Planning: "Chờ giáo viên duyệt dự án",
  Changing: "Chờ giáo viên duyệt lại dự án",
  Decline: "Dự án bị từ chối",
};

const MatchedProjectDetails = ({ data, isMatched }) => {
  const navigate = useNavigate();
  const { selectedGroup } = useSelector((state) => state.class);
  console.log(data);

  const handleNavigate = () => {
    navigate("temp-matching");
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* Thẻ hiển thị trạng thái nếu là matchedData */}
      {isMatched && data.status && (
        <Tag
          color={statusColors[data.status]}
          style={{ fontSize: "1rem", padding: "7px 10px", fontWeight: "bold" }}
        >
          Trạng thái: {statusTexts[data.status]}
        </Tag>
      )}
      {!isMatched && data.status === "InProgress" && (
        <>
          <div>
            <Tag
              color={statusColors[data.status]}
              style={{
                fontSize: "1rem",
                padding: "7px 10px",
                fontWeight: "bold",
              }}
            >
              Trạng thái: {statusTexts[data.status]}
            </Tag>
            <Button
              className="button-select-mentor-not-matched"
              onClick={handleNavigate} // Gắn hàm điều hướng vào nút
            >
              Lựa Chọn Ngay!
            </Button>
          </div>
        </>
      )}
      {!isMatched && data.status === "Planning" && (
        <>
          <div>
            <Tag
              color={statusColors[data.status]}
              style={{
                fontSize: "1rem",
                padding: "7px 10px",
                fontWeight: "bold",
              }}
            >
              Trạng thái: {statusTexts[data.status]}
            </Tag>
          </div>
        </>
      )}
      {!isMatched && data.status === "Changing" && (
        <>
          <div>
            <Tag
              color={statusColors[data.status]}
              style={{
                fontSize: "1rem",
                padding: "7px 10px",
                fontWeight: "bold",
              }}
            >
              Trạng thái: {statusTexts[data.status]}
            </Tag>
          </div>
        </>
      )}
      {!isMatched && data.status === "Decline" && (
        <>
          <div>
            <Tag
              color={statusColors[data.status]}
              style={{
                fontSize: "1rem",
                padding: "7px 10px",
                fontWeight: "bold",
              }}
            >
              Trạng thái: {statusTexts[data.status]}
            </Tag>
          </div>
        </>
      )}
      {data.length !== 0 && (
        <ProjectCard
          style={{ width: "100%", marginLeft: 1 }}
          project={data}
          className="always-hover"
        />
      )}
      {/* ProjectCard - hiển thị thông tin dự án */}
      {data.length === 0 && (
        <Card style={{ textAlign: "center" }}>
          <Tag style={{ backgroundColor: "#fbfb5cc4" }}>
            {selectedGroup.groupName}
          </Tag>
          Dự án chưa được cập nhật. Hãy liên hệ với nhóm để cập nhật dự án!
        </Card>
      )}
      {/* Mentor Details Card - chỉ hiển thị khi có mentorId */}
      {isMatched && data.mentorId && (
        <div
          className="elevated-card"
          style={{
            position: "absolute",
            bottom: "19%",
            left: "61%",
            boxShadow: "rgb(135, 186, 207) 0px 2px 6px",
            borderRadius: 21,
            border: "none",
            backgroundColor: "#c2e1eb",
            padding: 16,
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
          <div
            style={{ borderRadius: 17, padding: 20, backgroundColor: "white" }}
          >
            <Card.Meta
              description={
                <>
                  <p style={{ marginBottom: 2 }}>
                    <strong>Tên: </strong>
                    {data?.mentorId?.username}
                  </p>
                  <p style={{ marginBottom: 2 }}>
                    <strong>Email: </strong>
                    {data?.mentorId?.email}
                  </p>
                  <p style={{ marginBottom: 2 }}>
                    <strong>Số điện thoại: </strong>
                    {data?.mentorId?.phoneNumber}
                  </p>
                </>
              }
            />
          </div>
        </div>
      )}
    </Space>
  );
};

export default MatchedProjectDetails;
