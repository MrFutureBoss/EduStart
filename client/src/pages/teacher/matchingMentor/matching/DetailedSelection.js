import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Avatar,
  Tooltip,
  Badge,
  Progress,
  message,
  Row,
  Col,
  Typography,
  Tabs,
  Spin,
} from "antd";
import { ArrowLeftOutlined, StarFilled } from "@ant-design/icons";
import ProjectCard from "../ProjectCard";
import "../../teacherCSS/DetailedSelection.css";
import { assignMentorToProject } from "../../../../api";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setIsAssig } from "../../../../redux/slice/MatchingSlice";

const { Title } = Typography;
const { TabPane } = Tabs;

const DetailedSelection = () => {
  const navigate = useNavigate();
  const teacherId = localStorage.getItem("userId");
  const dispatch = useDispatch();

  const [project, setProject] = useState(null);
  const [mentorPreferred, setMentorPreferred] = useState([]);
  const [teacherPreferredMentors, setTeacherPreferredMentors] = useState([]);
  const [matchingMentors, setMatchingMentors] = useState([]);
  const [assignedMentor, setAssignedMentor] = useState(null);
  const [activeTab, setActiveTab] = useState("mentorPreferred");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const storedProject = JSON.parse(localStorage.getItem("selectedProject"));
  // Lấy project từ localStorage
  useEffect(() => {
    if (!storedProject || !storedProject.project) {
      message.warning("Dữ liệu không tồn tại. Quay lại trang trước.");
      navigate(-1);
      return;
    }
    setProject(storedProject.project);
  }, [navigate]);

  // Gọi API và chuẩn hóa dữ liệu mentor
  useEffect(() => {
    const fetchMentorSuggestions = async () => {
      if (!project || !project.groupId) return;
      setIsLoading(true);
      try {
        const { data } = await axios.post(
          "http://localhost:9999/tempMatching/recommend-group",
          {
            teacherId,
            groupId: project.groupId,
          }
        );

        // Chuẩn hóa mentorPreferred
        const normalizedMentorPreferred = data.mentorPreferred.map((m) => ({
          mentorId: String(m.mentorId),
          username: m.username,
          email: m.email,
          phoneNumber: m.phoneNumber,
          currentLoad: m.currentLoad,
          maxLoad: m.maxLoad,
          isPreferredGroup: m.isPreferredGroup,
          matchedProfessions: m.matchedProfessions,
          matchedSpecialties: m.matchedSpecialties,
          avatarUrl: m.avatarUrl || "/default-avatar.png",
          origin: "mentorPreferred", // Gán origin
        }));

        // Chuẩn hóa teacherPreferredMentors
        const normalizedTeacherPreferredMentors =
          data.teacherPreferredMentors.map((m) => ({
            mentorId: String(m.mentorId._id),
            username: m.mentorId.username,
            email: m.mentorId.email,
            phoneNumber: m.mentorId.phoneNumber,
            priority: m.priority,
            matchedSpecialties: m.matchedSpecialties,
            matchCount: m.matchCount,
            professions: m.professions,
            currentLoad: m.currentLoad,
            maxLoad: m.maxLoad,
            avatarUrl: m.mentorId.avatarUrl || "/default-avatar.png",
            origin: "teacherPreferred", // Gán origin
          }));

        // Chuẩn hóa matchingMentors
        const normalizedMatchingMentors = data.matchingMentors
          .filter((m) => m !== null)
          .map((m) => ({
            mentorId: String(m.mentorId),
            username: m.username,
            email: m.email,
            phoneNumber: m.phoneNumber,
            matchedSpecialties: m.matchedSpecialties,
            matchCount: m.matchCount,
            professions: m.professions,
            currentLoad: m.currentLoad,
            maxLoad: m.maxLoad,
            avatarUrl: m.avatarUrl || "/default-avatar.png",
            origin: "matching", // Gán origin
          }));

        // Loại bỏ mentor trùng lặp theo độ ưu tiên
        const mentorIdsPreferred = new Set(
          normalizedMentorPreferred.map((m) => m.mentorId)
        );
        const filteredTeacherPreferredMentors =
          normalizedTeacherPreferredMentors.filter(
            (m) => !mentorIdsPreferred.has(m.mentorId)
          );

        const mentorIdsTeacherPreferred = new Set(
          filteredTeacherPreferredMentors.map((m) => m.mentorId)
        );
        const filteredMatchingMentors = normalizedMatchingMentors.filter(
          (m) =>
            !mentorIdsPreferred.has(m.mentorId) &&
            !mentorIdsTeacherPreferred.has(m.mentorId)
        );

        setMentorPreferred(normalizedMentorPreferred);
        setTeacherPreferredMentors(filteredTeacherPreferredMentors);
        setMatchingMentors(filteredMatchingMentors);

        // Chọn mentor ban đầu
        let initialMentor = null;
        if (normalizedMentorPreferred.length > 0)
          initialMentor = { ...normalizedMentorPreferred[0] };
        else if (filteredTeacherPreferredMentors.length > 0)
          initialMentor = { ...filteredTeacherPreferredMentors[0] };
        else if (filteredMatchingMentors.length > 0)
          initialMentor = { ...filteredMatchingMentors[0] };

        if (initialMentor) {
          setAssignedMentor(initialMentor);
          // Loại bỏ mentor vừa gán ra khỏi danh sách gợi ý tương ứng
          if (initialMentor.origin === "mentorPreferred") {
            setMentorPreferred((prev) =>
              prev.filter((m) => m.mentorId !== initialMentor.mentorId)
            );
          } else if (initialMentor.origin === "teacherPreferred") {
            setTeacherPreferredMentors((prev) =>
              prev.filter((m) => m.mentorId !== initialMentor.mentorId)
            );
          } else if (initialMentor.origin === "matching") {
            setMatchingMentors((prev) =>
              prev.filter((m) => m.mentorId !== initialMentor.mentorId)
            );
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy gợi ý mentor:", error);
        message.error("Không thể lấy gợi ý mentor cho nhóm.");
      } finally {
        setIsLoading(false);
      }
    };

    if (project && project.groupId) {
      fetchMentorSuggestions();
    }
  }, [project, teacherId]);

  // Xác định tab active
  const determineActiveTab = () => {
    if (!assignedMentor) {
      if (mentorPreferred.length > 0) return "mentorPreferred";
      if (teacherPreferredMentors.length > 0) return "teacherPreferredMentors";
      if (matchingMentors.length > 0) return "matchingMentors";
      return "mentorPreferred";
    }

    // Dựa trên origin
    if (assignedMentor.origin === "mentorPreferred") {
      return "mentorPreferred";
    } else if (assignedMentor.origin === "teacherPreferred") {
      return "teacherPreferredMentors";
    } else {
      return "matchingMentors";
    }
  };

  useEffect(() => {
    setActiveTab(determineActiveTab());
    // eslint-disable-next-line
  }, [
    assignedMentor,
    mentorPreferred,
    teacherPreferredMentors,
    matchingMentors,
  ]);
  dispatch(setIsAssig(true));

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleSelectMentor = (mentor) => {
    // Nếu có mentor đã gán trước đó và khác mentor mới
    if (assignedMentor && assignedMentor.mentorId !== mentor.mentorId) {
      // Thêm mentor cũ về đúng danh sách dựa trên origin
      if (assignedMentor.origin === "mentorPreferred") {
        setMentorPreferred((prev) =>
          prev.some((m) => m.mentorId === assignedMentor.mentorId)
            ? prev
            : [...prev, assignedMentor]
        );
      } else if (assignedMentor.origin === "teacherPreferred") {
        setTeacherPreferredMentors((prev) =>
          prev.some((m) => m.mentorId === assignedMentor.mentorId)
            ? prev
            : [...prev, assignedMentor]
        );
      } else if (assignedMentor.origin === "matching") {
        setMatchingMentors((prev) =>
          prev.some((m) => m.mentorId === assignedMentor.mentorId)
            ? prev
            : [...prev, assignedMentor]
        );
      }
    }

    // Mentor mới giữ nguyên origin của mình
    setAssignedMentor(mentor);

    // Loại mentor mới khỏi tất cả các danh sách gợi ý
    setMentorPreferred((prev) =>
      prev.filter((m) => m.mentorId !== mentor.mentorId)
    );
    setTeacherPreferredMentors((prev) =>
      prev.filter((m) => m.mentorId !== mentor.mentorId)
    );
    setMatchingMentors((prev) =>
      prev.filter((m) => m.mentorId !== mentor.mentorId)
    );
  };

  const handleSaveMentor = async () => {
    if (!project || !assignedMentor) {
      message.error("Không tìm thấy dự án hoặc mentor để lưu.");
      return;
    }

    setIsSaving(true);
    try {
      await assignMentorToProject(
        project.groupId,
        assignedMentor.mentorId,
        teacherId
      );
      message.success("Mentor đã được lưu vào dự án.");
      navigate(-1);
    } catch (error) {
      console.error("Lỗi khi lưu mentor:", error);
      message.error("Lưu mentor thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="detailed-selection-container">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={handleGoBack}
        className="back-button"
      >
        Quay lại
      </Button>

      <Row gutter={[16, 16]} className="main-row">
        <Col xs={24} md={24} className="left-column">
          <div className="left-content">
            {project && (
              <ProjectCard
                project={project}
                style={{ width: "171%", height: "102%", marginLeft: "-10px" }}
                className="always-hover"
                group={{
                  groupName: storedProject?.project?.groupName,
                  className: storedProject?.project?.className,
                }}
              />
            )}

            {assignedMentor && (
              <div className="assigned-mentor-section">
                <Title
                  style={{
                    marginTop: "-12px",
                    marginLeft: 4,
                    color: "#0b73a7",
                  }}
                  level={4}
                >
                  Mentor Đã Được Gán
                </Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <AssignedMentorCard
                      mentor={assignedMentor}
                      onSave={handleSaveMentor}
                      isSaving={isSaving}
                      projectSpecialties={
                        project?.projectCategory?.specialtyIds || []
                      }
                    />
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </Col>

        <Col xs={24} md={24} className="right-column">
          <div className="mentors-list-container">
            <Tabs activeKey={activeTab} onChange={handleTabChange} centered>
              <TabPane tab="Mentor Ưu Tiên Nhóm" key="mentorPreferred">
                {mentorPreferred.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {mentorPreferred.map((mentor) => (
                      <Col xs={24} sm={12} md={8} key={mentor.mentorId}>
                        <MentorDetailCard
                          mentor={mentor}
                          onSelect={() => handleSelectMentor(mentor)}
                          projectSpecialties={
                            project?.projectCategory?.specialtyIds || []
                          }
                        />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <Title level={4}>Không có mentor nào trong mục này!</Title>
                  </div>
                )}
              </TabPane>

              <TabPane tab="Mentor Bạn Ưu Tiên" key="teacherPreferredMentors">
                {teacherPreferredMentors.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {teacherPreferredMentors.map((mentor) => (
                      <Col xs={24} sm={12} md={8} key={mentor.mentorId}>
                        <MentorDetailCard
                          mentor={mentor}
                          onSelect={() => handleSelectMentor(mentor)}
                          projectSpecialties={
                            project?.projectCategory?.specialtyIds || []
                          }
                        />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <Title level={4}>Không có mentor nào trong mục này.</Title>
                  </div>
                )}
              </TabPane>

              <TabPane tab="Mentor Phù Hợp" key="matchingMentors">
                {matchingMentors.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {matchingMentors.map((mentor) => (
                      <Col xs={24} sm={12} md={8} key={mentor.mentorId}>
                        <MentorDetailCard
                          mentor={mentor}
                          onSelect={() => handleSelectMentor(mentor)}
                          projectSpecialties={
                            project?.projectCategory?.specialtyIds || []
                          }
                        />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <Title level={4}>Không có mentor nào trong mục này!</Title>
                  </div>
                )}
              </TabPane>
            </Tabs>
          </div>
        </Col>
      </Row>
    </div>
  );
};

const AssignedMentorCard = ({
  mentor,
  onSave,
  isSaving,
  projectSpecialties,
}) => {
  const isPreferredGroup = mentor.origin === "mentorPreferred";
  const isTeacherPreferred = mentor.origin === "teacherPreferred";

  const highlightedSpecialties =
    mentor.matchedSpecialties?.map((spec) => ({
      name: spec.name,
      isMatch: projectSpecialties?.includes(spec.specialtyId),
    })) || [];

  const matchedProfessions =
    mentor.matchedProfessions || mentor.professions || [];

  return (
    <Card className="assigned-mentor-card" hoverable>
      <Button
        onClick={onSave}
        disabled={isSaving}
        loading={isSaving}
        style={{
          position: "absolute",
          right: 16,
          top: 16,
          backgroundColor: "rgb(51, 144, 193)",
          color: "white",
        }}
      >
        Lưu
      </Button>
      <Card.Meta
        className="assigned-mentor-card-meta"
        avatar={<Avatar src={mentor.avatarUrl} />}
        title={
          <Tooltip title={mentor.email}>
            {mentor.username}
            <Badge
              showZero
              count={mentor.matchedSpecialties?.length || 0}
              style={{
                backgroundColor: "rgb(168, 220, 209)",
                color: "black",
                marginLeft: 16,
              }}
            />
            {isPreferredGroup && (
              <Badge
                count={
                  <StarFilled style={{ color: "#ff9800", fontSize: "20px" }} />
                }
                style={{
                  backgroundColor: "#f5f5f5",
                  borderRadius: 30,
                  color: "white",
                  marginLeft: 8,
                }}
              />
            )}
            {isTeacherPreferred && (
              <Badge
                count="UT"
                style={{
                  backgroundColor: "#faad14",
                  color: "black",
                  marginLeft: 8,
                }}
              />
            )}
          </Tooltip>
        }
        description={
          <>
            <p style={{ marginBottom: 2 }}>
              <strong>Lĩnh Vực: </strong>
              {matchedProfessions.map((spec) => spec.name).join(", ") ||
                "Không có"}
            </p>
            <p style={{ marginBottom: 2 }}>
              <strong>Chuyên môn: </strong>
              {highlightedSpecialties.map((spec, index) => (
                <span
                  key={index}
                  className={spec.isMatch ? "flashing-specialty" : ""}
                >
                  {spec.name}
                  {index < highlightedSpecialties.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
            <strong style={{ display: "flex" }}>
              Nhóm đã nhận:
              <p
                style={{
                  marginBottom: 2,
                  marginLeft: 7,
                  color: "rgb(51, 144, 193)",
                }}
              >
                {mentor.currentLoad}/{mentor.maxLoad}
              </p>
            </strong>
            <Progress
              percent={(mentor.currentLoad / mentor.maxLoad) * 100}
              size="small"
              status="active"
              showInfo={false}
            />
          </>
        }
      />
    </Card>
  );
};

const MentorDetailCard = ({ mentor, onSelect, projectSpecialties }) => {
  const isPreferredGroup = mentor.origin === "mentorPreferred";
  const isTeacherPreferred = mentor.origin === "teacherPreferred";

  const highlightedSpecialties =
    mentor.matchedSpecialties?.map((spec) => ({
      name: spec.name,
      isMatch: projectSpecialties?.includes(spec.specialtyId),
    })) || [];

  const professions = mentor.matchedProfessions || mentor.professions || [];

  return (
    <Card className={"mentor-card-detail-select"} hoverable>
      <Button
        onClick={onSelect}
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          fontSize: 13,
          padding: "4px 8px",
        }}
      >
        Chọn
      </Button>
      <Card.Meta
        avatar={<Avatar src={mentor.avatarUrl} />}
        title={
          <Tooltip title={mentor.email}>
            {mentor.username}
            <Badge
              showZero
              count={mentor.matchedSpecialties?.length || 0}
              style={{
                backgroundColor: "rgb(168, 220, 209)",
                color: "black",
                marginLeft: 16,
              }}
            />
            {isPreferredGroup && (
              <Badge
                count={
                  <StarFilled style={{ color: "#ff9800", fontSize: "20px" }} />
                }
                style={{
                  backgroundColor: "#f5f5f5",
                  borderRadius: 30,
                  color: "white",
                  marginLeft: 8,
                }}
              />
            )}
            {isTeacherPreferred && (
              <Badge
                count="UT"
                style={{
                  backgroundColor: "#faad14",
                  color: "black",
                  marginLeft: 8,
                }}
              />
            )}
          </Tooltip>
        }
        description={
          <>
            <p style={{ marginBottom: 2 }}>
              <strong>Lĩnh Vực: </strong>
              {professions.map((spec) => spec.name).join(", ") || "Không có"}
            </p>
            <p style={{ marginBottom: 2 }}>
              <strong>Chuyên môn: </strong>
              {highlightedSpecialties.map((spec, index) => (
                <span
                  key={index}
                  className={spec.isMatch ? "flashing-specialty" : ""}
                >
                  {spec.name}
                  {index < highlightedSpecialties.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
            <strong style={{ display: "flex" }}>
              Nhóm đã nhận:
              <p
                style={{
                  marginBottom: 2,
                  marginLeft: 7,
                  color: "rgb(51, 144, 193)",
                }}
              >
                {mentor.currentLoad}/{mentor.maxLoad}
              </p>
            </strong>
            <Progress
              style={{ width: "75%" }}
              percent={(mentor.currentLoad / mentor.maxLoad) * 100}
              size="small"
              status="active"
              showInfo={false}
            />
          </>
        }
      />
    </Card>
  );
};

export default DetailedSelection;
