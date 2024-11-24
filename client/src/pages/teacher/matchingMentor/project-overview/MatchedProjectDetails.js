// MatchedProjectDetails.js
import React from "react";
import { Tag, Space, Card, Button, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import ProjectCard from "../ProjectCard";
import "../../teacherCSS/MatchedProjectCard.css";
import { useSelector } from "react-redux";

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
    navigate("/teacher/temp-matching");
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* Thẻ hiển thị trạng thái nếu là matchedData */}
      {isMatched && data.status && (
        <Alert
          message={`Trạng thái: ${statusTexts[data.status]}`}
          type={
            data.status === "Pending"
              ? "warning"
              : data.status === "Accepted"
              ? "success"
              : data.status === "Decline"
              ? "error"
              : "info"
          }
          showIcon
          style={{ marginBottom: "10px", width: "50%" }}
        />
      )}
      {!isMatched && data.status === "InProgress" && (
        <>
          <div style={{ display: "flex" }}>
            <Alert
              message={`Trạng thái: ${statusTexts[data.status]}`}
              type={
                data.status === "Pending"
                  ? "warning"
                  : data.status === "Accepted"
                  ? "success"
                  : data.status === "Decline"
                  ? "error"
                  : "info"
              }
              showIcon
              style={{ marginRight: "30%" }}
            />
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
            <Alert
              message={`Trạng thái: ${statusTexts[data.status]}`}
              type={
                data.status === "Pending"
                  ? "warning"
                  : data.status === "Accepted"
                  ? "success"
                  : data.status === "Decline"
                  ? "error"
                  : "info"
              }
              showIcon
              style={{ marginBottom: "10px" }}
            />
          </div>
        </>
      )}
      {!isMatched && data.status === "Changing" && (
        <>
          <div>
            <Alert
              message={`Trạng thái: ${statusTexts[data.status]}`}
              type={
                data.status === "Pending"
                  ? "warning"
                  : data.status === "Accepted"
                  ? "success"
                  : data.status === "Decline"
                  ? "error"
                  : "info"
              }
              showIcon
              style={{ marginBottom: "10px" }}
            />
          </div>
        </>
      )}

      {!isMatched && data.status === "Decline" && (
        <>
          <div>
            <Alert
              message={`Trạng thái: ${statusTexts[data.status]}`}
              type={
                data.status === "Pending"
                  ? "warning"
                  : data.status === "Accepted"
                  ? "success"
                  : data.status === "Decline"
                  ? "error"
                  : "info"
              }
              showIcon
              style={{ marginBottom: "10px", width: "50%" }}
            />
          </div>
        </>
      )}
      {data.length !== 0 && (
        <ProjectCard
          style={{ width: "98%", marginLeft: 1, minHeight: "fit-content" }}
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
            bottom: "62%",
            left: "76%",
            boxShadow: "rgb(135, 186, 207) 0px 2px 6px",
            borderRadius: 20,
            border: "none",
            backgroundColor: "#c2e1eb",
            padding: 7,
          }}
        >
          <strong
            style={{
              position: "absolute",
              top: -9,
              left: 0,
              fontSize: "0.7rem",
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
            style={{ borderRadius: 17, padding: 16, backgroundColor: "white" }}
          >
            <Card.Meta
              description={
                <>
                  <p style={{ marginBottom: 2, fontSize: "0.8rem" }}>
                    <strong>Tên: </strong>
                    {data?.mentorId?.username}
                  </p>
                  <p style={{ marginBottom: 2, fontSize: "0.8rem" }}>
                    <strong>Email: </strong>
                    {data?.mentorId?.email}
                  </p>
                  <p style={{ marginBottom: 2, fontSize: "0.8rem" }}>
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
