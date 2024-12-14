import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ProjectCard from "../teacher/matchingMentor/ProjectCard";
import {
  Row,
  Col,
  Spin,
  Select,
  Typography,
  Badge,
  Input,
  Button,
  Tabs,
  Empty,
  Pagination,
} from "antd";
import "./ProjectsList.css";
import { BASE_URL } from "../../utilities/initalValue";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { setUserLogin } from "../../redux/slice/UserSlice";

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

const ALL_PROFESSION = { id: "all", name: "Tất cả Lĩnh Vực" };
const ALL_SPECIALTY = { id: "all", name: "Tất cả Chuyên Môn" };

const ProjectsList = () => {
  const dispatch = useDispatch();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedProfessionId, setSelectedProfessionId] = useState(
    ALL_PROFESSION.id
  );
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [preferredProjects, setPreferredProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const { userLogin } = useSelector((state) => state.user);
  const jwt = localStorage.getItem("jwt");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  console.log("userLogin", userLogin);

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const userRes = await axios.get(`${BASE_URL}/user/profile`, config);
        dispatch(setUserLogin(userRes.data));
        const response = await axios.get(
          `${BASE_URL}/mentor/projects-list/${userRes.data?._id}`,
          config
        );
        const projectData = response.data.projects;

        const preferred = projectData.filter(
          (project) => project.isPreference === true
        );
        setPreferredProjects(preferred.map((project) => project._id));
        setProjects(projectData);
        setFilteredProjects(projectData);

        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi tải dự án:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, [config, dispatch]);

  const totalProjectsCount = projects.length;

  const currentProjects = useMemo(() => {
    return activeTab === "all"
      ? projects
      : projects.filter((proj) => preferredProjects.includes(proj._id));
  }, [activeTab, projects, preferredProjects]);

  useEffect(() => {
    const uniqueProfessionsMap = new Map();
    const specialtiesMap = new Map();

    currentProjects.forEach((proj) => {
      proj.projectCategory.professionId.forEach((p) => {
        if (!uniqueProfessionsMap.has(p._id)) {
          uniqueProfessionsMap.set(p._id, p.name);
        }
      });
      proj.projectCategory.specialtyIds.forEach((s) => {
        if (!specialtiesMap.has(s._id)) {
          specialtiesMap.set(s._id, s.name);
        }
      });
    });

    setProfessions([
      ALL_PROFESSION,
      ...Array.from(uniqueProfessionsMap, ([id, name]) => ({ id, name })),
    ]);

    setSpecialties([
      ALL_SPECIALTY,
      ...Array.from(specialtiesMap, ([id, name]) => ({ id, name })),
    ]);
  }, [currentProjects]);

  useEffect(() => {
    let filtered = currentProjects;

    if (selectedProfessionId !== ALL_PROFESSION.id) {
      filtered = filtered.filter((project) =>
        project.projectCategory.professionId.some(
          (p) => p._id === selectedProfessionId
        )
      );
    }

    if (selectedSpecialtyId && selectedSpecialtyId !== ALL_SPECIALTY.id) {
      filtered = filtered.filter((project) =>
        project.projectCategory.specialtyIds.some(
          (s) => s._id === selectedSpecialtyId
        )
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [selectedProfessionId, selectedSpecialtyId, searchTerm, currentProjects]);

  const handleProfessionChange = (professionId) => {
    setSelectedProfessionId(professionId);
    setSelectedSpecialtyId(null);
  };

  const handleSpecialtyChange = (specialtyId) => {
    setSelectedSpecialtyId(specialtyId);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSelectProject = async (projectId) => {
    const project = projects.find((proj) => proj._id === projectId);
    if (preferredProjects.includes(projectId)) {
      const result = await Swal.fire({
        title: "Xác nhận",
        text: `Bạn có chắc chắn muốn bỏ chọn dự án: ${project.name}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Bỏ chọn",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        try {
          await axios.post(
            `${BASE_URL}/mentor/remove-preference`,
            {
              mentorId: userLogin?._id,
              projectIds: [projectId],
            },
            config
          );
          setPreferredProjects((prev) => prev.filter((id) => id !== projectId));
          Swal.fire("Thành công!", "Dự án đã được bỏ chọn.", "success");
        } catch (error) {
          console.error("Lỗi khi bỏ chọn dự án:", error);
          Swal.fire("Lỗi!", "Có lỗi xảy ra khi bỏ chọn dự án.", "error");
        }
      }
    } else {
      const result = await Swal.fire({
        title: "Xác nhận",
        text: `Bạn có chắc chắn muốn chọn dự án: ${project.name}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Chọn",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        try {
          await axios.post(
            `${BASE_URL}/mentor/projects/save-preferences`,
            {
              mentorId: userLogin?._id,
              projectIds: [projectId],
            },
            config
          );
          setPreferredProjects((prev) => [...prev, projectId]);
          Swal.fire("Thành công!", "Dự án đã được lưu thành công.", "success");
        } catch (error) {
          console.error("Lỗi khi lưu dự án:", error);
          Swal.fire("Lỗi!", "Có lỗi xảy ra khi lưu lựa chọn của bạn.", "error");
        }
      }
    }
  };

  const handleSelectTab = () => {
    setActiveTab("selected");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage]);

  if (loading) {
    return <Spin tip="Đang tải dự án..." />;
  }

  return (
    <div>
      <div className="projects-list-container">
        <div className="filter-section-mentor-preference">
          <Search
            placeholder="Tìm kiếm theo tên dự án"
            onChange={handleSearchChange}
            style={{ width: 250, marginRight: 20 }}
            enterButton
          />
          <Select
            placeholder="Lọc theo Lĩnh Vực"
            style={{ width: 250, marginRight: 20 }}
            value={selectedProfessionId}
            onChange={handleProfessionChange}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {professions.map((profession) => (
              <Option key={profession.id} value={profession.id}>
                {profession.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Lọc theo Chuyên Môn"
            style={{ width: 250, marginRight: 20 }}
            value={selectedSpecialtyId}
            onChange={handleSpecialtyChange}
            showSearch
            allowClear
            optionFilterProp="children"
            disabled={
              selectedProfessionId === ALL_PROFESSION.id ||
              specialties.length <= 1
            }
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {specialties.map((specialty) => (
              <Option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </Option>
            ))}
          </Select>
          <Button
            className="button-select-mentor-not-matched"
            onClick={handleSelectTab}
          >
            Đã chọn {preferredProjects.length}/10
          </Button>
        </div>

        <Badge
          showZero
          style={{
            backgroundColor: "#62b6cb",
            transform: "scale(0.9)",
            top: "22px",
            right: "-161px",
          }}
          count={totalProjectsCount}
        ></Badge>
        <Badge
          showZero
          style={{
            backgroundColor: "#62b6cb",
            transform: "scale(0.9)",
            top: "22px",
            right: "-301px",
          }}
          count={preferredProjects.length}
        ></Badge>

        <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
          <TabPane
            tab={
              <span style={{ fontSize: "medium" }}>Danh sách tất cả dự án</span>
            }
            key="all"
          >
            {paginatedProjects.length > 0 ? (
              <Row style={{ rowGap: 0 }} gutter={[16, 16]}>
                {paginatedProjects.map((project) => (
                  <Col style={{ padding: 0 }} key={project._id}>
                    <ProjectCard
                      project={project}
                      className="always-hover-1"
                      onSelect={() => handleSelectProject(project._id)}
                      isFavorite={preferredProjects.includes(project._id)}
                      style={{
                        border: preferredProjects.includes(project._id)
                          ? "3px solid #ff9800"
                          : "",

                        width: 372,
                      }}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty
                description={
                  searchTerm || selectedProfessionId !== ALL_PROFESSION.id
                    ? "Không có kết quả nào trùng"
                    : "Danh sách không có dự án nào"
                }
              />
            )}
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredProjects.length}
              onChange={handlePageChange}
              style={{ marginTop: 20, textAlign: "center" }}
            />
          </TabPane>

          <TabPane
            tab={<span style={{ fontSize: "medium" }}>Dự án đã lựa chọn</span>}
            key="selected"
          >
            {paginatedProjects.length > 0 ? (
              <Row gutter={[16, 16]}>
                {paginatedProjects
                  .filter((project) => preferredProjects.includes(project._id))
                  .map((project) => (
                    <Col style={{ padding: 0 }} key={project._id}>
                      <ProjectCard
                        isFavorite={preferredProjects.includes(project._id)}
                        project={project}
                        className="always-hover-1"
                        onSelect={() => handleSelectProject(project._id)}
                        style={{
                          border: "3px solid #ff9800",
                          width: 372,
                        }}
                      />
                    </Col>
                  ))}
              </Row>
            ) : (
              <Empty
                description={
                  searchTerm || selectedProfessionId !== ALL_PROFESSION.id
                    ? "Không có kết quả nào trùng"
                    : "Bạn chưa chọn dự án nào"
                }
              />
            )}
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={
                filteredProjects.filter((project) =>
                  preferredProjects.includes(project._id)
                ).length
              }
              onChange={handlePageChange}
              style={{ marginTop: 20, textAlign: "center" }}
            />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectsList;
