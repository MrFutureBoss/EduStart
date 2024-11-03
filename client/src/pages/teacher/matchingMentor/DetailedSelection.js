// src/components/DetailedSelection.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
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
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ProjectCard from "./ProjectCard";
import "../teacherCSS/DetailedSelection.css"; // Import CSS
import {
  setAssignedMentorsMap,
  setProjectData,
} from "../../../redux/slice/MatchingSlice";
import { assignMentorToProject, fetchProjectData } from "../../../api"; // Import API

const { Title } = Typography;
const { TabPane } = Tabs;

const DetailedSelection = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const projectData = useSelector((state) => state.matching.projectData);
  const mentorsData = useSelector((state) => state.matching.mentorsData);
  const assignedMentorsMap = useSelector(
    (state) => state.matching.assignedMentorsMap
  );
  const teacherId = localStorage.getItem("userId");
  const selectedClassId = useSelector(
    (state) => state.matching.selectedClassId
  );
  const project = projectData.find((p) => p._id === projectId);
  const mentors = mentorsData[projectId];

  // Lấy mentor từ assignedMentorsMap nếu có, hoặc từ danh sách ưu tiên
  const initialAssignedMentor =
    (assignedMentorsMap[projectId] && assignedMentorsMap[projectId][0]) ||
    mentors?.mentorPreferred?.[0] ||
    mentors?.teacherPreferredMentors?.[0] ||
    mentors?.matchingMentors?.[0] ||
    null;

  const [assignedMentor, setAssignedMentor] = useState(initialAssignedMentor);
  const [isSaving, setIsSaving] = useState(false); // Thêm state này

  const [filteredMentors, setFilteredMentors] = useState({
    mentorPreferred: [],
    teacherPreferredMentors: [],
    matchingMentors: [],
  });

  // Hàm lọc mentor dựa trên ưu tiên và loại trừ mentor đã được gán
  const filterMentors = () => {
    const assignedMentorId = assignedMentor ? assignedMentor.mentorId : null;

    const mentorPreferredFiltered =
      mentors?.mentorPreferred?.filter(
        (mentor) => mentor.mentorId !== assignedMentorId
      ) || [];
    const teacherPreferredMentorsFiltered =
      mentors?.teacherPreferredMentors?.filter(
        (mentor) =>
          mentor.mentorId !== assignedMentorId &&
          !mentorPreferredFiltered.some((m) => m.mentorId === mentor.mentorId)
      ) || [];
    const matchingMentorsFiltered =
      mentors?.matchingMentors?.filter(
        (mentor) =>
          mentor.mentorId !== assignedMentorId &&
          !mentorPreferredFiltered.some(
            (m) => m.mentorId === mentor.mentorId
          ) &&
          !teacherPreferredMentorsFiltered.some(
            (m) => m.mentorId === mentor.mentorId
          )
      ) || [];

    setFilteredMentors({
      mentorPreferred: mentorPreferredFiltered,
      teacherPreferredMentors: teacherPreferredMentorsFiltered,
      matchingMentors: matchingMentorsFiltered,
    });
  };

  // Lọc mentor khi assignedMentor hoặc mentors thay đổi
  useEffect(() => {
    filterMentors();
  }, [assignedMentor, mentors]);

  // Hàm xác định tab active dựa trên nguồn của assignedMentor
  const determineActiveTab = () => {
    if (!assignedMentor) {
      // Nếu không có mentor được gán, mặc định vào tab đầu tiên
      if (mentors?.mentorPreferred?.length > 0) return "mentorPreferred";
      if (mentors?.teacherPreferredMentors?.length > 0)
        return "teacherPreferredMentors";
      if (mentors?.matchingMentors?.length > 0) return "matchingMentors";
      return "mentorPreferred"; // Fallback mặc định
    }

    if (
      mentors?.mentorPreferred?.some(
        (m) => m.mentorId === assignedMentor.mentorId
      )
    ) {
      return "mentorPreferred";
    }
    if (
      mentors?.teacherPreferredMentors?.some(
        (m) => m.mentorId === assignedMentor.mentorId
      )
    ) {
      return "teacherPreferredMentors";
    }
    if (
      mentors?.matchingMentors?.some(
        (m) => m.mentorId === assignedMentor.mentorId
      )
    ) {
      return "matchingMentors";
    }
    return "mentorPreferred"; // Fallback mặc định
  };

  // Khởi tạo activeTab dựa trên nguồn của assignedMentor
  const [activeTab, setActiveTab] = useState(determineActiveTab());

  // Cập nhật activeTab khi assignedMentor hoặc mentors thay đổi
  useEffect(() => {
    setActiveTab(determineActiveTab());
  }, [assignedMentor, mentors]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleSelectMentor = (mentor) => {
    if (assignedMentor) {
      const newFilteredMentors = { ...filteredMentors };
      if (
        mentors.mentorPreferred.some(
          (m) => m.mentorId === assignedMentor.mentorId
        )
      ) {
        newFilteredMentors.mentorPreferred.push(assignedMentor);
      } else if (
        mentors.teacherPreferredMentors.some(
          (m) => m.mentorId === assignedMentor.mentorId
        )
      ) {
        newFilteredMentors.teacherPreferredMentors.push(assignedMentor);
      } else {
        newFilteredMentors.matchingMentors.push(assignedMentor);
      }
      setFilteredMentors(newFilteredMentors);
    }

    setAssignedMentor(mentor);

    setFilteredMentors((prev) => ({
      mentorPreferred: prev.mentorPreferred.filter(
        (m) => m.mentorId !== mentor.mentorId
      ),
      teacherPreferredMentors: prev.teacherPreferredMentors.filter(
        (m) => m.mentorId !== mentor.mentorId
      ),
      matchingMentors: prev.matchingMentors.filter(
        (m) => m.mentorId !== mentor.mentorId
      ),
    }));
  };

  // Chỉnh sửa hàm handleSaveMentor
  const handleSaveMentor = async () => {
    if (!project || !assignedMentor) {
      message.error("Không tìm thấy dự án hoặc mentor để lưu.");
      return;
    }

    setIsSaving(true); // Bắt đầu trạng thái lưu

    try {
      await assignMentorToProject(project.groupId, assignedMentor.mentorId);
      message.success("Mentor đã được lưu vào dự án.");
      const projectResponse = await fetchProjectData(
        teacherId,
        selectedClassId
      );
      const projects = projectResponse.data.projects;
      dispatch(setProjectData(projects));
      // Chuyển hướng trở về trang trước
      navigate(-1);
    } catch (error) {
      console.error("Lỗi khi lưu mentor:", error);
      message.error("Lưu mentor thất bại.");
    } finally {
      setIsSaving(false); // Kết thúc trạng thái lưu
    }
  };

  // Effect để tự động gán mentor nếu không có dữ liệu
  useEffect(() => {
    if (
      !assignedMentorsMap[projectId] ||
      assignedMentorsMap[projectId].length === 0
    ) {
      if (initialAssignedMentor) {
        dispatch(
          setAssignedMentorsMap({
            ...assignedMentorsMap,
            [projectId]: [initialAssignedMentor],
          })
        );
        message.success("Đã tự động gán mentor cho dự án.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, initialAssignedMentor]);

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
            <ProjectCard
              project={project}
              style={{ width: "188%", height: "102%", marginLeft: "-10px" }}
              className="always-hover"
            />

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
                      isSaving={isSaving} // Thêm prop này
                      mentorPreferred={mentors.mentorPreferred}
                      teacherPreferredMentors={mentors.teacherPreferredMentors}
                      projectSpecialties={
                        project?.projectCategory?.specialtyIds
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
                {filteredMentors.mentorPreferred.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {filteredMentors.mentorPreferred.map((mentor) => (
                      <Col xs={24} sm={12} md={8} key={mentor.mentorId}>
                        <MentorDetailCard
                          mentor={mentor}
                          onSelect={() => handleSelectMentor(mentor)}
                          mentorPreferred={mentors.mentorPreferred}
                          teacherPreferredMentors={
                            mentors.teacherPreferredMentors
                          }
                          projectSpecialties={
                            project?.projectCategory?.specialtyIds
                          }
                        />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <Title level={4}>Không có mentor nào trong mục này!</Title>
                    <Title level={5}>Lựa chọn mục khác để xem thêm.</Title>
                  </div>
                )}
              </TabPane>

              <TabPane tab="Mentor Bạn Ưu Tiên" key="teacherPreferredMentors">
                {filteredMentors.teacherPreferredMentors.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {filteredMentors.teacherPreferredMentors.map((mentor) => (
                      <Col xs={24} sm={12} md={8} key={mentor.mentorId}>
                        <MentorDetailCard
                          mentor={mentor}
                          onSelect={() => handleSelectMentor(mentor)}
                          mentorPreferred={mentors.mentorPreferred}
                          teacherPreferredMentors={
                            mentors.teacherPreferredMentors
                          }
                          projectSpecialties={
                            project?.projectCategory?.specialtyIds
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
                {filteredMentors.matchingMentors.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {filteredMentors.matchingMentors.map((mentor) => (
                      <Col xs={24} sm={12} md={8} key={mentor.mentorId}>
                        <MentorDetailCard
                          mentor={mentor}
                          onSelect={() => handleSelectMentor(mentor)}
                          mentorPreferred={mentors.mentorPreferred}
                          teacherPreferredMentors={
                            mentors.teacherPreferredMentors
                          }
                          projectSpecialties={
                            project?.projectCategory?.specialtyIds
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

// Component để hiển thị mentor đã được gán với tùy chọn lưu
const AssignedMentorCard = ({
  mentor,
  onSave,
  isSaving, // Thêm prop này
  mentorPreferred,
  teacherPreferredMentors,
  projectSpecialties,
}) => {
  const isPreferredGroup = mentorPreferred?.some(
    (m) => m.mentorId === mentor.mentorId
  );
  const isTeacherPreferred = teacherPreferredMentors?.some(
    (m) => m.mentorId === mentor.mentorId
  );

  const highlightedSpecialties =
    mentor.specialties?.map((spec) => ({
      name: spec.name,
      isMatch: projectSpecialties?.some(
        (projSpec) => projSpec._id === spec.specialtyId
      ),
    })) || [];

  return (
    <Card className="assigned-mentor-card" hoverable>
      <Button
        onClick={onSave}
        disabled={isSaving} // Vô hiệu hóa khi đang lưu
        loading={isSaving} // Hiển thị loading khi đang lưu
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
                count="C"
                style={{
                  backgroundColor: "#3390C1",
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
              {mentor.professions?.map((spec) => spec.name).join(", ") ||
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

// Component để hiển thị chi tiết mentor với tùy chọn chọn
const MentorDetailCard = ({
  mentor,
  onSelect,
  mentorPreferred,
  teacherPreferredMentors,
  projectSpecialties,
}) => {
  const isPreferredGroup = mentorPreferred?.some(
    (m) => m.mentorId === mentor.mentorId
  );
  const isTeacherPreferred = teacherPreferredMentors?.some(
    (m) => m.mentorId === mentor.mentorId
  );

  const highlightedSpecialties =
    mentor.specialties?.map((spec) => ({
      name: spec.name,
      isMatch: projectSpecialties?.some(
        (projSpec) => projSpec._id === spec.specialtyId
      ),
    })) || [];

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
                count="C"
                style={{
                  backgroundColor: "#3390C1",
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
              {mentor.professions?.map((spec) => spec.name).join(", ") ||
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
