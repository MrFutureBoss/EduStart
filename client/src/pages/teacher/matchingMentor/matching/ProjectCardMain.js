// src/components/ProjectCardMain/ProjectCardMain.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  Spin,
  Button,
  message,
  Tabs,
  Row,
  Col,
  Card,
  Alert,
  Badge,
  Modal,
  Input,
} from "antd";
import "../../teacherCSS/ProjectCardMain.css";
import {
  fetchClassSummaryData,
  fetchProjectData,
  fetchMentorsTempMatching,
  getMatchedProjectClass,
  fetchSuggestMentors,
  deleteMatched,
  getMatchedCount,
} from "../../../../api";
import {
  setClassesWithUnupdatedProjects,
  setClassSummaries,
  setCounts,
  setEmptyClasses,
  setLoadingClasses,
  setMatchedClasses,
  setNotMatchedClasses,
} from "../../../../redux/slice/ClassSlice";
import ProjectCard from "../ProjectCard";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  pointerWithin,
} from "@dnd-kit/core";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  RetweetOutlined,
  SelectOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  setSelectedClassId,
  setLoadingProjects,
  setActiveId,
  updateAssignedMentorsMap,
  setClassMentorsData,
  setIsAssig,
  resetClassData,
} from "../../../../redux/slice/MatchingSlice";
import MentorSuggestionRow from "./MentorSuggestionRow";
import MentorDropZone from "./MentorDropZone";
import ProjectCardMatched from "../ProjectCardMatched";

const { Option } = Select;
const { TabPane } = Tabs;

const { Search } = Input;

const ALL_PROFESSION = { id: "all", name: "Tất cả Lĩnh Vực" };
const ALL_SPECIALTY = { id: "all", name: "Tất cả Chuyên Môn" };

const ProjectCardMain = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");

  const { classSummaries, loadingClasses } = useSelector(
    (state) => state.class
  );
  const { selectedClassId, loadingProjects, activeId, classData, isAssig } =
    useSelector((state) => state.matching);
  const teacherId = localStorage.getItem("userId");
  const { sid, currentSemester } = useSelector((state) => state.semester);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );
  console.log(selectedClassId);

  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [visible, setVisible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupIdToDelete, setGroupIdToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  // State cho search và filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfessionId, setSelectedProfessionId] = useState(
    ALL_PROFESSION.id
  );
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(
    ALL_SPECIALTY.id
  );
  const [professions, setProfessions] = useState([ALL_PROFESSION]);
  const [specialties, setSpecialties] = useState([ALL_SPECIALTY]);
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!sid) return; // Chỉ tải khi `sid` có giá trị

      dispatch(setLoadingClasses(true));
      try {
        const classResponse = await fetchClassSummaryData(teacherId, sid);

        const {
          classSummaries: fetchedClassSummaries,
          counts,
          matchedClasses,
          notMatchedClasses,
          emptyClasses,
          classesWithUnupdatedProjects,
        } = classResponse.data;

        dispatch(setClassSummaries(fetchedClassSummaries));
        dispatch(setCounts(counts));
        dispatch(setMatchedClasses(matchedClasses));
        dispatch(setNotMatchedClasses(notMatchedClasses));
        dispatch(setEmptyClasses(emptyClasses));
        dispatch(setClassesWithUnupdatedProjects(classesWithUnupdatedProjects));

        // Kiểm tra và tự động chọn lớp đầu tiên
        if (fetchedClassSummaries.length > 0) {
          const firstClassId = fetchedClassSummaries[0].classId;
          dispatch(setSelectedClassId(firstClassId)); // Cập nhật classId mới
          localStorage.setItem("selectedClassId", firstClassId);
          handleClassChange(firstClassId);
          fetchMatchedGroupsCount(firstClassId);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        dispatch(setLoadingClasses(false));
      }
    };

    loadData();
  }, [teacherId, sid]); // Chỉ chạy khi `sid` thay đổi

  // Bắt sự kiện chọn lại mentor
  useEffect(() => {
    if (isAssig) {
      handleFetchClass(selectedClassId);
      setActiveTab("2");
    }
  }, [isAssig, navigate]);

  // Bắt sự kiện chọn lại kỳ
  useEffect(() => {
    const loadClassAndProjects = async () => {
      if (sid && selectedClassId) {
        dispatch(setLoadingProjects(true));

        try {
          // Gọi fetchMatchedGroups
          const matchedData = await fetchMatchedGroups(selectedClassId, sid);

          // Cập nhật Redux state với dữ liệu mới
          dispatch(
            setClassMentorsData({
              classId: selectedClassId,
              projectData: [], // Hoặc lấy dữ liệu mới nếu cần
              mentorsData: {}, // Reset mentors
              assignedMentorsMap: {}, // Reset mapping
              showSuggestions: false,
              pendingAcceptedGroups: matchedData.pendingAccepted || [],
              declinedGroups: matchedData.declined || [],
              matchedGroups: matchedData.matchedGroups || [],
            })
          );
          if (sid === currentSemester?._id) {
            await handleFetchClass(selectedClassId);
          }
        } catch (error) {
          console.error("Error fetching class and projects:", error);
        } finally {
          dispatch(setLoadingProjects(false));
        }
      }
    };

    loadClassAndProjects();
  }, [sid]); // Chỉ chạy khi cả sid và selectedClassId thay đổi

  // hàm để khi chuyển kỳ
  const fetchMatchedGroups = async (classId, sid) => {
    try {
      const matchedResponse = await getMatchedProjectClass(classId, sid);
      const matchedData = matchedResponse?.data;

      if (matchedData?.groups && Array.isArray(matchedData?.groups)) {
        const pendingAccepted = matchedData?.groups.filter(
          (g) =>
            g.matchedInfo &&
            (g.matchedInfo.status === "Pending" ||
              g.matchedInfo.status === "Accepted")
        );

        const declined = matchedData?.groups.filter(
          (g) => g.matchedInfo && g.matchedInfo.status === "Rejected"
        );

        return {
          pendingAccepted,
          declined,
          matchedGroups: matchedData?.groups, // Return all matched groups
        };
      }
      return {
        pendingAccepted: [],
        declined: [],
        matchedGroups: [],
      };
    } catch (error) {
      console.error("Error fetching matched groups:", error);
      return {
        pendingAccepted: [],
        declined: [],
        matchedGroups: [],
      };
    }
  };

  const fetchMatchedGroupsCount = async (classId) => {
    try {
      setLoading(true);
      const response = await getMatchedCount(classId);
      setData(response.data.data); // Assuming API response has the structure above
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Hàm để chuyển lớp
  const handleClassChange = async (classId) => {
    dispatch(setSelectedClassId(classId));
    localStorage.setItem("selectedClassId", classId);

    // Check if class data is already cached
    const existingClassData = classData[classId];

    if (existingClassData) {
      // Data exists in Redux; no need to fetch
      // Optionally, you can perform any additional actions if needed
      return;
    }
    dispatch(setIsAssig(false));
    // Data does not exist; fetch it
    dispatch(setLoadingProjects(true));
    try {
      // Fetch project data
      const projectResponse = await fetchProjectData(teacherId, classId);
      const projects = projectResponse.data.projects;

      // Initialize assignedMentorsMap
      const initialAssignedMap = {};
      projects.forEach((project) => {
        initialAssignedMap[project._id] = [];
      });

      // Fetch matched groups
      const matchedResponse = await getMatchedProjectClass(classId, sid);
      const matchedData = matchedResponse.data;
      let pendingAccepted = [];
      let declined = [];
      let matchedGroups = [];

      if (matchedData.groups && Array.isArray(matchedData.groups)) {
        pendingAccepted = matchedData.groups.filter(
          (g) =>
            g.matchedInfo &&
            (g.matchedInfo.status === "Pending" ||
              g.matchedInfo.status === "Accepted")
        );
        declined = matchedData.groups.filter(
          (g) => g.matchedInfo && g.matchedInfo.status === "Rejected"
        );
        matchedGroups = matchedData.groups; // Assuming you need to store all matched groups
      }

      // Fetch mentor suggestions if necessary
      const mentorSuggestions = await fetchSuggestedMentors(
        classId,
        projects,
        initialAssignedMap
      );

      // Consolidate all fetched data
      const { mentorsData, assignedMentorsMap, showSuggestions } =
        mentorSuggestions;

      // Dispatch to set all class data at once
      dispatch(
        setClassMentorsData({
          classId,
          projectData: projects,
          mentorsData,
          assignedMentorsMap,
          showSuggestions,
          pendingAcceptedGroups: pendingAccepted,
          declinedGroups: declined,
          matchedGroups: matchedGroups,
        })
      );
      // Xử lý professions & specialties từ projects
      await fetchMatchedGroupsCount();
      extractProfessionsAndSpecialties(projects);
    } catch (error) {
      console.error("Error in handleClassChange:", error);
    } finally {
      dispatch(setLoadingProjects(false));
    }
  };

  const handleFetchClass = async (classId) => {
    dispatch(setSelectedClassId(classId));
    localStorage.setItem("selectedClassId", classId);

    // Check if class data is already cached

    dispatch(setIsAssig(false));
    // Data does not exist; fetch it
    dispatch(setLoadingProjects(true));
    try {
      // Fetch project data
      const projectResponse = await fetchProjectData(teacherId, classId);
      const projects = projectResponse.data.projects;

      // Initialize assignedMentorsMap
      const initialAssignedMap = {};
      projects.forEach((project) => {
        initialAssignedMap[project._id] = [];
      });

      // Fetch matched groups
      const matchedResponse = await getMatchedProjectClass(classId, sid);
      const matchedData = matchedResponse.data;
      let pendingAccepted = [];
      let declined = [];
      let matchedGroups = [];

      if (matchedData.groups && Array.isArray(matchedData.groups)) {
        pendingAccepted = matchedData.groups.filter(
          (g) =>
            g.matchedInfo &&
            (g.matchedInfo.status === "Pending" ||
              g.matchedInfo.status === "Accepted")
        );
        declined = matchedData.groups.filter(
          (g) => g.matchedInfo && g.matchedInfo.status === "Rejected"
        );
        matchedGroups = matchedData.groups; // Assuming you need to store all matched groups
      }

      // Fetch mentor suggestions if necessary
      const mentorSuggestions = await fetchSuggestedMentors(
        classId,
        projects,
        initialAssignedMap
      );

      // Consolidate all fetched data
      const { mentorsData, assignedMentorsMap, showSuggestions } =
        mentorSuggestions;

      // Dispatch to set all class data at once
      dispatch(
        setClassMentorsData({
          classId,
          projectData: projects,
          mentorsData,
          assignedMentorsMap,
          showSuggestions,
          pendingAcceptedGroups: pendingAccepted,
          declinedGroups: declined,
          matchedGroups: matchedGroups,
        })
      );
      extractProfessionsAndSpecialties(projects);
      await fetchMatchedGroupsCount();
    } catch (error) {
      console.error("Error in handleClassChange:", error);
    } finally {
      dispatch(setLoadingProjects(false));
    }
  };

  const fetchSuggestedMentors = async (
    classId,
    projects,
    assignedMentorsMap
  ) => {
    setIsFetchingSuggestions(true);
    try {
      const unmatchedProjects = projects.filter((p) => !p.isMatched);
      const unmatchedProjectsMap = new Map(
        unmatchedProjects.map((proj) => [proj.groupId, proj])
      );

      const suggestResponse = await fetchSuggestMentors(classId);
      const suggestions = suggestResponse.data.suggestions || [];

      let mentorDataMap = {};
      let finalAssignedMentorsMap = { ...assignedMentorsMap };

      if (suggestions.length > 0) {
        const filteredSuggestions = suggestions.filter((item) =>
          unmatchedProjectsMap.has(item.groupId?._id)
        );

        filteredSuggestions.forEach((item) => {
          const groupId = item.groupId?._id;
          const project = unmatchedProjectsMap.get(groupId);
          if (project) {
            const projectId = project._id;
            mentorDataMap[projectId] = {
              mentorPreferred: item.mentorPreferred || [],
              teacherPreferredMentors: (
                item.teacherPreferredMentors || []
              ).sort((a, b) => a.priority - b.priority),
              matchingMentors: item.matchingMentors || [],
            };

            const {
              mentorPreferred,
              teacherPreferredMentors,
              matchingMentors,
            } = mentorDataMap[projectId];

            let initialMentor = null;
            if (mentorPreferred.length > 0) {
              initialMentor = mentorPreferred[0];
            } else if (teacherPreferredMentors.length > 0) {
              initialMentor = teacherPreferredMentors[0];
            } else if (matchingMentors.length > 0) {
              initialMentor = matchingMentors[0];
            }

            finalAssignedMentorsMap[projectId] = initialMentor
              ? [initialMentor]
              : [];
          }
        });
        await fetchMatchedGroupsCount(classId);

        return {
          mentorsData: mentorDataMap,
          assignedMentorsMap: finalAssignedMentorsMap,
          showSuggestions: true,
        };
      } else {
        return {
          mentorsData: {},
          assignedMentorsMap,
          showSuggestions: false,
        };
      }
    } catch (error) {
      console.error("Error fetching mentor suggestions:", error);
      return {
        mentorsData: {},
        assignedMentorsMap,
        showSuggestions: false,
      };
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const fetchMatchingMentor = async () => {
    if (!selectedClassId) {
      return;
    }

    setIsFetchingSuggestions(true);
    dispatch(setLoadingProjects(true));
    try {
      const currentClassData = classData[selectedClassId];
      if (!currentClassData) {
        return;
      }
      // Fetch temporary matching
      await fetchMentorsTempMatching(selectedClassId, teacherId);

      await handleFetchClass(selectedClassId);
    } catch (error) {
      console.error("Error in fetchMatchingMentor:", error);
    } finally {
      dispatch(setLoadingProjects(false));
      setIsFetchingSuggestions(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && over.id.startsWith("project-")) {
      const projectId = over.id.replace("project-", "");
      const uniqueId = active.id;
      const mentorId = uniqueId.split("-").pop();

      const currentClassData = classData[selectedClassId];
      if (!currentClassData) {
        return;
      }

      const mentor =
        currentClassData.mentorsData[projectId]?.mentorPreferred?.find(
          (m) => String(m.mentorId) === String(mentorId)
        ) ||
        currentClassData.mentorsData[projectId]?.teacherPreferredMentors?.find(
          (m) => String(m.mentorId) === String(mentorId)
        ) ||
        currentClassData.mentorsData[projectId]?.matchingMentors?.find(
          (m) => String(m.mentorId) === String(mentorId)
        );

      if (mentor) {
        dispatch(
          updateAssignedMentorsMap({
            classId: selectedClassId,
            projectId,
            mentors: [mentor],
          })
        );

        // Update classMentorsData's assignedMentorsMap directly
        const updatedAssigned = {
          ...currentClassData.assignedMentorsMap,
          [projectId]: [mentor],
        };

        dispatch(
          setClassMentorsData({
            classId: selectedClassId,
            projectData: currentClassData.projectData,
            mentorsData: currentClassData.mentorsData,
            assignedMentorsMap: updatedAssigned,
            showSuggestions: currentClassData.showSuggestions,
            pendingAcceptedGroups: currentClassData.pendingAcceptedGroups,
            declinedGroups: currentClassData.declinedGroups,
            matchedGroups: currentClassData.matchedGroups,
          })
        );
      }
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await deleteMatched(groupIdToDelete);
      await handleFetchClass(selectedClassId);

      message.success("Ghép hiện tại đã bị xoá thành công!");
      navigate(`/teacher/temp-matching/select-mentor`);
    } catch (error) {
      console.error("Lỗi khi xoá ghép:", error);
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };
  // Retrieve data for the selected class
  const selectedClassData = classData[selectedClassId] || {};

  // Mở modal xác nhận
  const openModal = (groupId, projectId) => {
    setGroupIdToDelete(groupId);
    setModalVisible(true);
    const project = selectedClassData.projectData.find(
      (p) => p._id === projectId
    );
    localStorage.setItem("selectedProject", JSON.stringify({ project }));
  };

  const unmatchedProjects = selectedClassData.projectData
    ? selectedClassData.projectData.filter((project) => !project.isMatched)
    : [];

  const pendingAcceptedGroups = selectedClassData.pendingAcceptedGroups || [];
  const declinedGroups = selectedClassData.declinedGroups || [];

  // Hàm tách lấy professions và specialties
  const extractProfessionsAndSpecialties = (projects) => {
    const uniqueProfessionsMap = new Map();
    const uniqueSpecialtiesMap = new Map();

    projects.forEach((proj) => {
      if (proj.projectCategory) {
        proj.projectCategory.professionId.forEach((p) => {
          if (!uniqueProfessionsMap.has(p._id)) {
            uniqueProfessionsMap.set(p._id, p.name);
          }
        });
        proj.projectCategory.specialtyIds.forEach((s) => {
          if (!uniqueSpecialtiesMap.has(s._id)) {
            uniqueSpecialtiesMap.set(s._id, s.name);
          }
        });
      }
    });

    setProfessions([
      ALL_PROFESSION,
      ...Array.from(uniqueProfessionsMap, ([id, name]) => ({ id, name })),
    ]);

    setSpecialties([
      ALL_SPECIALTY,
      ...Array.from(uniqueSpecialtiesMap, ([id, name]) => ({ id, name })),
    ]);
  };

  // Hàm lọc chung
  const filterProject = (project) => {
    if (selectedProfessionId !== ALL_PROFESSION.id) {
      const hasProfession = project.projectCategory?.professionId?.some(
        (p) => p._id === selectedProfessionId
      );
      if (!hasProfession) return false;
    }

    if (selectedSpecialtyId !== ALL_SPECIALTY.id) {
      const hasSpecialty = project.projectCategory?.specialtyIds?.some(
        (s) => s._id === selectedSpecialtyId
      );
      if (!hasSpecialty) return false;
    }

    if (searchTerm) {
      const matchesSearch = project.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
    }

    return true;
  };

  // Lọc dữ liệu cho từng tab
  const filteredUnmatchedProjects = useMemo(() => {
    return unmatchedProjects.filter(filterProject);
  }, [
    unmatchedProjects,
    searchTerm,
    selectedProfessionId,
    selectedSpecialtyId,
  ]);

  const filteredPendingAcceptedGroups = useMemo(() => {
    return pendingAcceptedGroups.filter(({ group }) =>
      filterProject(group.projectId)
    );
  }, [
    pendingAcceptedGroups,
    searchTerm,
    selectedProfessionId,
    selectedSpecialtyId,
  ]);

  const filteredDeclinedGroups = useMemo(() => {
    return declinedGroups.filter(({ group }) => filterProject(group.projectId));
  }, [declinedGroups, searchTerm, selectedProfessionId, selectedSpecialtyId]);

  const badgeMeanings = [
    {
      type: <StarFilled style={{ color: "#ff9800", fontSize: "20px" }} />,
      description: "Mentor lựa chọn nhóm này",
    },
    {
      type: "UT",
      description: "Mentor được giáo viên ưu tiên",
      color: "#faad14",
    },
    {
      type: "1",
      description: "Số chuyên môn trùng khớp",
      color: "#a8dcd1",
    },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={({ active }) => dispatch(setActiveId(active.id))}
      onDragEnd={(event) => {
        dispatch(setActiveId(null));
        handleDragEnd(event);
      }}
    >
      <div className="main-project-container">
        <div className="header-bar">
          <div className="class-select-container" style={{ padding: "9px" }}>
            <label className="class-select-label">Lớp Được Chọn:</label>
            <Select
              showSearch
              placeholder="Chọn lớp"
              optionFilterProp="children"
              onChange={handleClassChange}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              value={selectedClassId}
              className="class-select"
            >
              {classSummaries.map((classItem) => {
                return (
                  <Option key={classItem.classId} value={classItem.classId}>
                    {classItem.className}
                  </Option>
                );
              })}
            </Select>
          </div>

          <div className="button-group">
            {/* Thanh tìm kiếm và lọc */}
            <Button style={{ marginRight: 10 }}>
              Số nhóm đã ghép: {data?.matchedGroups}/{data?.totalGroups}
            </Button>
            <Search
              placeholder="Tìm kiếm theo tên dự án"
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200, marginRight: 10 }}
              enterButton
            />
            <Select
              placeholder="Lọc Lĩnh Vực"
              style={{ width: 160, marginRight: 10 }}
              value={selectedProfessionId}
              onChange={(value) => {
                setSelectedProfessionId(value);
                setSelectedSpecialtyId(ALL_SPECIALTY.id);
              }}
              optionFilterProp="children"
              showSearch
            >
              {professions.map((profession) => (
                <Option key={profession.id} value={profession.id}>
                  {profession.name}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Lọc Chuyên Môn"
              style={{ width: 160, marginRight: 10 }}
              value={selectedSpecialtyId}
              onChange={(value) => setSelectedSpecialtyId(value)}
              optionFilterProp="children"
              showSearch
              disabled={
                selectedProfessionId === ALL_PROFESSION.id ||
                specialties.length <= 1
              }
            >
              {specialties.map((specialty) => (
                <Option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </Option>
              ))}
            </Select>

            {filteredUnmatchedProjects.length > 0 && (
              <Button
                style={{ marginRight: "10px" }}
                onClick={fetchMatchingMentor}
                disabled={isFetchingSuggestions}
              >
                Gợi ý ghép Mentor
              </Button>
            )}
          </div>
        </div>

        <div
          className={`container-projects ${
            selectedClassData.showSuggestions ? "single-column" : "grid-layout"
          }`}
        >
          {visible && (
            <Alert
              style={{ padding: 7 }}
              type="info"
              closable
              onClose={() => setVisible(false)}
              description={
                <div
                  style={{
                    display: "flex",
                  }}
                >
                  <strong
                    style={{ marginRight: 20, fontSize: 13, marginLeft: 10 }}
                  >
                    Chú thích các biểu tượng:
                  </strong>
                  {badgeMeanings.map((badge) => (
                    <div
                      key={badge.type}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Badge
                        count={badge.type}
                        style={{
                          backgroundColor: badge.color,
                          color: badge.type === "C" ? "white" : "black",
                          borderRadius: "12px",
                          transform: "scale(0.8)",
                        }}
                      />
                      <span style={{ marginRight: 30, fontSize: 13 }}>
                        {badge.description}
                      </span>
                    </div>
                  ))}
                </div>
              }
            />
          )}
          {loadingProjects ? (
            <Spin />
          ) : filteredUnmatchedProjects.length > 0 ||
            filteredPendingAcceptedGroups.length > 0 ||
            filteredDeclinedGroups.length > 0 ? (
            <Tabs
              onChange={(key) => setActiveTab(key)}
              activeKey={activeTab}
              style={{ width: "100%" }}
              destroyInactiveTabPane
            >
              {/* Tab Pane: Chưa chọn mentor */}
              <TabPane
                tab={`Chưa chọn mentor (${filteredUnmatchedProjects.length})`}
                key="1"
              >
                {filteredUnmatchedProjects.map((project) => {
                  const mentorPreferredIds = new Set(
                    (
                      selectedClassData.mentorsData[project._id]
                        ?.mentorPreferred || []
                    ).map((m) => String(m.mentorId))
                  );

                  const teacherPreferredIds = new Set(
                    (
                      selectedClassData.mentorsData[project._id]
                        ?.teacherPreferredMentors || []
                    ).map((m) => String(m.mentorId))
                  );

                  return (
                    <div
                      className={`single-project-row ${
                        selectedClassData.showSuggestions && !project.isMatched
                          ? "suggestion-layout"
                          : "grid-layout"
                      }`}
                      key={project._id}
                    >
                      <div className="project-card-wrapper">
                        <h6 className="main-title-suggest">Chưa Chọn Mentor</h6>
                        <ProjectCard
                          className="always-hover"
                          style={{ width: 370 }}
                          group={{
                            groupName: project.groupName,
                            className: project.className,
                          }}
                          project={project}
                          assignedMentors={
                            selectedClassData.assignedMentorsMap[project._id] ||
                            []
                          }
                        />
                      </div>

                      {selectedClassData.showSuggestions &&
                        selectedClassData.mentorsData[project._id] && (
                          <div className="suggestions-and-drop-zone">
                            <div className="mentor-suggestions-wrapper">
                              <MentorSuggestionRow
                                title="Mentor Ưu Tiên Chọn Nhóm:"
                                mentors={
                                  selectedClassData.mentorsData[project._id]
                                    .mentorPreferred
                                }
                                assignedMentors={
                                  selectedClassData.assignedMentorsMap[
                                    project._id
                                  ] || []
                                }
                                projectId={project._id}
                                existingMentorIds={new Set()}
                                colorClass="mentor-preferred-card"
                                teacherPreferredMentors={
                                  selectedClassData.mentorsData[project._id]
                                    .teacherPreferredMentors
                                }
                              />
                              <MentorSuggestionRow
                                title="Mentor Được Giáo Viên Ưu Tiên:"
                                mentors={
                                  selectedClassData.mentorsData[project._id]
                                    .teacherPreferredMentors
                                }
                                projectId={project._id}
                                assignedMentors={
                                  selectedClassData.assignedMentorsMap[
                                    project._id
                                  ] || []
                                }
                                existingMentorIds={mentorPreferredIds}
                                colorClass="teacher-preferred-card"
                                teacherPreferredMentors={
                                  selectedClassData.mentorsData[project._id]
                                    .teacherPreferredMentors
                                }
                              />
                              <MentorSuggestionRow
                                title="Mentor Có Chuyên Môn Phù Hợp:"
                                mentors={
                                  selectedClassData.mentorsData[project._id]
                                    .matchingMentors
                                }
                                assignedMentors={
                                  selectedClassData.assignedMentorsMap[
                                    project._id
                                  ] || []
                                }
                                projectId={project._id}
                                existingMentorIds={
                                  new Set([
                                    ...mentorPreferredIds,
                                    ...teacherPreferredIds,
                                  ])
                                }
                                colorClass="matching-mentors-card"
                                teacherPreferredMentors={
                                  selectedClassData.mentorsData[project._id]
                                    .teacherPreferredMentors
                                }
                              />
                            </div>
                            <MentorDropZone
                              projectId={project._id}
                              groupId={project.groupId}
                              assignedMentors={
                                selectedClassData.assignedMentorsMap[
                                  project._id
                                ]?.map((mentor) => ({
                                  ...mentor,
                                  isTeacherPreferred:
                                    selectedClassData.mentorsData[
                                      project._id
                                    ].teacherPreferredMentors.some(
                                      (teacherPreferred) =>
                                        String(teacherPreferred.mentorId) ===
                                        String(mentor.mentorId)
                                    ),
                                  isPreferredGroup:
                                    selectedClassData.mentorsData[
                                      project._id
                                    ].mentorPreferred.some(
                                      (preferredMentor) =>
                                        String(preferredMentor.mentorId) ===
                                        String(mentor.mentorId)
                                    ),
                                })) || []
                              }
                              mentors={
                                selectedClassData.mentorsData[project._id]
                              }
                              activeId={activeId}
                              onMentorAssigned={() => {
                                handleFetchClass(selectedClassId);
                                setActiveTab("2"); // Chuyển sang tab 2 sau khi gán mentor
                              }}
                              teacherId={teacherId}
                              selectedClassId={selectedClassId}
                            />
                          </div>
                        )}
                    </div>
                  );
                })}
              </TabPane>

              {/* Tab Pane: Đã ghép mentor */}
              <TabPane
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
                tab={`Đã ghép mentor (${filteredPendingAcceptedGroups.length})`}
                key="2"
              >
                <Row gutter={[16, 16]}>
                  {filteredPendingAcceptedGroups.map(
                    ({ group, matchedInfo }) => {
                      const statusText =
                        matchedInfo.status === "Pending"
                          ? "Chờ Mentor Chấp Nhận"
                          : "Mentor Đã Chấp Nhận";
                      const statusColor =
                        matchedInfo.status === "Pending"
                          ? "rgb(234 156 0)"
                          : "#52c41a";
                      const mentor = matchedInfo.mentorId;
                      const mentorCate = matchedInfo.mentorProfession;
                      const professions =
                        mentorCate?.professionIds?.map(
                          (profession) => profession.name
                        ) || [];

                      // Lấy danh sách specialties
                      const specialties =
                        mentorCate?.specialties?.map(
                          (specialty) => specialty.specialtyId.name
                        ) || [];
                      const statusIcon =
                        matchedInfo.status === "Pending" ? (
                          <ClockCircleOutlined
                            style={{ color: "#faad14", marginLeft: 8 }}
                          />
                        ) : (
                          <CheckCircleOutlined
                            style={{ color: "#52c41a", marginLeft: 8 }}
                          />
                        );

                      return (
                        <Col
                          xs={24}
                          sm={12}
                          md={8}
                          lg={8}
                          key={matchedInfo._id}
                        >
                          <div
                            className="single-project-row grid-layout"
                            key={matchedInfo._id}
                          >
                            <div className="project-card-wrapper">
                              <h6
                                style={{ color: statusColor }}
                                className="main-title-suggest"
                              >
                                {statusText}
                                {statusIcon}
                              </h6>
                              <ProjectCardMatched
                                className="always-hover"
                                group={{
                                  groupName: group.name,
                                  className: group.classId.className,
                                }}
                                style={{
                                  width: 334,
                                  height: "fit-content",
                                }}
                                project={{
                                  _id: group.projectId._id,
                                  name: group.projectId.name,
                                  description: group.projectId.description,
                                  groupId: group._id,
                                  isMatched: true,
                                  status:
                                    matchedInfo.status === "Pending"
                                      ? "Pending"
                                      : "Accepted",
                                  projectCategory: matchedInfo.projectCategory,
                                }}
                                assignedMentors={[
                                  {
                                    mentorId: mentor._id,
                                    username: mentor.username,
                                    email: mentor.email,
                                    phoneNumber: mentor.phoneNumber,
                                  },
                                ]}
                                mentor={mentor}
                                professions={professions}
                                specialties={specialties}
                              />
                              <div className="assigned-mentors">
                                {/* Mentor Info Card */}

                                <Button
                                  type="link"
                                  onClick={() =>
                                    openModal(group?._id, group?.projectId?._id)
                                  }
                                  style={{
                                    color: "#fff",
                                    padding: 10,
                                    backgroundColor: "#62b6cb",
                                    fontWeight: 500,
                                    marginLeft: 218,
                                    position: "relative",
                                  }}
                                >
                                  <RetweetOutlined /> Chọn Lại Mentor
                                </Button>
                                <Modal
                                  title={
                                    <>
                                      <ExclamationCircleOutlined
                                        style={{
                                          color: "red",
                                          marginRight: 10,
                                        }}
                                      />
                                      <span style={{ color: "red" }}>
                                        Cảnh Báo
                                      </span>
                                    </>
                                  }
                                  visible={modalVisible}
                                  onOk={handleConfirm} // Gọi API khi nhấn OK
                                  onCancel={() => setModalVisible(false)}
                                  confirmLoading={loading} // Hiển thị trạng thái loading khi đang xử lý
                                  okText="Đồng ý"
                                  cancelText="Hủy"
                                >
                                  <p>
                                    Bạn có chắc chắn muốn chọn lại mentor không?
                                    Mentor đang được ghép hiện tại sẽ bị xoá.
                                  </p>
                                </Modal>
                              </div>
                            </div>
                          </div>
                        </Col>
                      );
                    }
                  )}
                </Row>
              </TabPane>

              {/* Tab Pane: Bị từ chối */}
              <TabPane
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
                tab={`Bị từ chối (${filteredDeclinedGroups.length})`}
                key="3"
              >
                <Row gutter={[16, 16]}>
                  {filteredDeclinedGroups.map(({ group, matchedInfo }) => {
                    const mentor = matchedInfo.mentorId;
                    const mentorCate = matchedInfo.mentorProfession;

                    const professions =
                      mentorCate?.professionIds?.map(
                        (profession) => profession.name
                      ) || [];

                    const specialties =
                      mentorCate?.specialties?.map(
                        (specialty) => specialty.specialtyId.name
                      ) || [];
                    const statusIcon =
                      matchedInfo.status === "Pending" ? (
                        <ClockCircleOutlined
                          style={{ color: "#faad14", marginLeft: 8 }}
                        />
                      ) : (
                        <CheckCircleOutlined
                          style={{ color: "#52c41a", marginLeft: 8 }}
                        />
                      );

                    return (
                      <Col xs={24} sm={12} md={8} lg={8} key={matchedInfo._id}>
                        <div
                          className="single-project-row grid-layout"
                          key={matchedInfo._id}
                        >
                          <div className="project-card-wrapper">
                            <h6
                              style={{ color: "red" }}
                              className="main-title-suggest"
                            >
                              Mentor Đã Từ Chối
                            </h6>
                            <ProjectCardMatched
                              className="always-hover"
                              group={{
                                groupName: group.name,
                                className: group.classId.className,
                              }}
                              style={{ width: 334, height: "fit-content" }}
                              project={{
                                _id: group.projectId._id,
                                name: group.projectId.name,
                                description: group.projectId.description,
                                groupId: group._id,
                                isMatched: true,
                                status: "Declined",
                              }}
                              assignedMentors={[
                                {
                                  mentorId: mentor._id,
                                  username: mentor.username,
                                  email: mentor.email,
                                  phoneNumber: mentor.phoneNumber,
                                },
                              ]}
                              mentor={mentor}
                              professions={professions}
                              specialties={specialties}
                            />
                            <div className="assigned-mentors">
                              {/* Mentor Info Card */}

                              <Button
                                type="link"
                                onClick={() =>
                                  openModal(group?._id, group?.projectId?._id)
                                }
                                style={{
                                  color: "#fff",
                                  padding: 10,
                                  backgroundColor: "#62b6cb",
                                  fontWeight: 500,
                                  marginLeft: 218,
                                }}
                              >
                                <RetweetOutlined /> Chọn Lại Mentor
                              </Button>
                              <Modal
                                title={
                                  <>
                                    <InfoCircleOutlined
                                      style={{ color: "orange" }}
                                    />
                                    <span
                                      style={{
                                        color: "orange",
                                        marginLeft: 10,
                                      }}
                                    >
                                      Thông báo
                                    </span>
                                  </>
                                }
                                visible={modalVisible}
                                onOk={handleConfirm} // Gọi API khi nhấn OK
                                onCancel={() => setModalVisible(false)}
                                confirmLoading={loading} // Hiển thị trạng thái loading khi đang xử lý
                                okText="Đồng ý"
                                cancelText="Hủy"
                              >
                                <p>
                                  Hiện tại nhóm này đã bị Mentor từ chối. Hãy
                                  chọn lại Mentor cho nhóm!
                                </p>
                              </Modal>
                            </div>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </TabPane>
            </Tabs>
          ) : selectedClassId ? (
            (() => {
              const selectedClass = classSummaries.find(
                (cls) => cls.classId === selectedClassId
              );

              if (!selectedClass)
                return <p>Vui lòng chọn một lớp để xem dự án.</p>;

              return selectedClass.groupDetails?.length === 0 ? (
                <p>Lớp chưa có nhóm</p>
              ) : (
                selectedClass.isFullyMatched && (
                  <p>Lớp đã ghép xong tất cả các nhóm</p>
                )
              );
            })()
          ) : (
            <p>Vui lòng chọn một lớp để xem dự án.</p>
          )}
        </div>
      </div>
    </DndContext>
  );
};

export default ProjectCardMain;
