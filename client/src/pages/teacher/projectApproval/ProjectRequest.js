// ProjectRequest.jsx
import React, { useEffect, useState } from "react"; 
import { useDispatch, useSelector } from "react-redux";
import {
  Tabs,
  Table,
  Modal,
  Input,
  message,
  Space,
  Typography,
  Badge,
} from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../../utilities/initalValue";
import {
  setProjects,
  setSelectedProject,
  setDeclineMessage,
  removeProject,
  clearSelectedProjectToTop
} from "../../../redux/slice/ProjectSlice";
import ConfirmButton from "../../../components/Button/ConfirmButton";
import CancelButton from "../../../components/Button/CancelButton";
import io from "socket.io-client";
import { useLocation } from "react-router-dom";

const socket = io(BASE_URL);

const { confirm } = Modal;
const { Text } = Typography;
const { TabPane } = Tabs;

const ProjectRequest = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");

  const { projects, selectedProject, declineMessage, selectedProjectToTop } = useSelector(
    (state) => state.project
  );

  const [isDeclineModalVisible, setIsDeclineModalVisible] = useState(false);
  const [changingProjects, setChangingProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("1");
  const [orderedProjects, setOrderedProjects] = useState([]);
  const [orderedChangingProjects, setOrderedChangingProjects] = useState([]);

  useEffect(() => {
    if (userId) {
      fetchProjects();
      fetchChangingProjects();
    }
  }, [dispatch, userId]);

  useEffect(() => {
    socket.emit("joinRoom", userId);

    socket.on("projectUpdated", (data) => {
      fetchProjects();
      fetchChangingProjects();
    });

    return () => {
      socket.off("projectUpdated");
    };
  }, [userId]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/project/planning-projects/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      let projectsArray = [];
      if (res.data.data && Array.isArray(res.data.data)) {
        projectsArray = res.data.data;
      } else if (Array.isArray(res.data)) {
        projectsArray = res.data;
      } else {
        console.error("Unexpected project data structure:", res.data);
        throw new Error("Invalid project data structure");
      }

      const projectsData = projectsArray.map((project) => ({
        ...project,
        projectId: project.projectId || project.id,
      }));

      dispatch(setProjects(projectsData));
    } catch (err) {
      message.error("Lỗi khi tải dữ liệu dự án!");
      console.error(err);
    }
  };

  const fetchChangingProjects = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/project/changing-projects/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      let changingProjectsArray = [];
      if (Array.isArray(res.data)) {
        changingProjectsArray = res.data;
      } else {
        console.error("Unexpected changing projects data structure:", res.data);
        throw new Error("Invalid changing projects data structure");
      }

      const changingProjectsData = changingProjectsArray.map((project) => ({
        ...project,
        projectId: project.projectId || project.id,
      }));
      setChangingProjects(Array.isArray(changingProjectsData) ? changingProjectsData : []);
      setOrderedChangingProjects(Array.isArray(changingProjectsData) ? changingProjectsData : []);
    } catch (err) {
      message.error("Lỗi khi tải dữ liệu dự án cập nhật!");
      console.error(err);
    }
  };

  const handleApprove = (projectId, projectName) => {
    confirm({
      title: `Bạn có chắc chắn muốn duyệt dự án: ${projectName}?`,
      icon: <ExclamationCircleOutlined />,
      onOk() {
        handleAction(projectId, "approve");
      },
      okText: "Đồng ý",
      cancelText: "Hủy",
    });
  };

  const handleDecline = (projectId, projectName) => {
    dispatch(setSelectedProject({ projectId, projectName }));
    dispatch(setDeclineMessage(""));
    setIsDeclineModalVisible(true);
  };

  const handleDeclineOk = () => {
    if (!declineMessage.trim()) {
      message.warning("Bạn cần nhập lý do từ chối!");
      return;
    }
    confirm({
      title: "Xác nhận từ chối",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn từ chối dự án với lý do: "${declineMessage}"?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk() {
        handleAction(selectedProject.projectId, "decline");
      },
    });
    setIsDeclineModalVisible(false);
  };

  const handleDeclineCancel = () => {
    setIsDeclineModalVisible(false);
    dispatch(setDeclineMessage(""));
  };

  const handleAction = (projectId, actionType) => {
    const projectType = activeTab === "2" ? "changing" : "planning";
    const apiUrl = `${BASE_URL}/project/${actionType}/${projectType}/${projectId}`;

    const payload =
      actionType === "decline" ? { declineMessage: declineMessage } : {};

    axios
      .put(apiUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
      })
      .then(() => {
        if (projectType === "changing") {
          setChangingProjects((prevProjects) =>
            prevProjects.filter((proj) => proj.projectId !== projectId)
          );
          setOrderedChangingProjects((prevProjects) =>
            prevProjects.filter((proj) => proj.projectId !== projectId)
          );
        } else {
          dispatch(removeProject(projectId));
          setOrderedProjects((prevProjects) =>
            prevProjects.filter((proj) => proj.projectId !== projectId)
          );
        }
        message.success(
          actionType === "approve" ? `Đã duyệt dự án` : `Đã từ chối dự án`
        );
      })
      .catch((err) => {
        message.error(
          actionType === "approve"
            ? "Đã xảy ra lỗi khi duyệt dự án"
            : "Đã xảy ra lỗi khi từ chối dự án"
        );
        console.error(err);
      });
  };

  const columns = [
    {
      title: "Tên lớp",
      dataIndex: "className",
      key: "className",
      render: (text) => <Text>{text || "Không có thông tin"}</Text>,
    },
    {
      title: "Tên nhóm",
      dataIndex: "groupName",
      key: "groupName",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Tên dự án",
      dataIndex: "projectName",
      key: "projectName",
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Lĩnh vực",
      dataIndex: "profession",
      key: "profession",
      render: (profession) =>
        Array.isArray(profession) && profession.length > 0 ? profession.join(", ") : "Không có danh mục",
    },
    {
      title: "Chuyên môn",
      dataIndex: "specialties",
      key: "specialties",
      render: (specialties) =>
        Array.isArray(specialties) && specialties.length > 0
          ? specialties.join(", ")
          : "Không có chuyên ngành",
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <ConfirmButton
            content="Duyệt"
            onClick={() => handleApprove(record.projectId, record.projectName)}
          />
          <CancelButton
            content="Từ chối"
            onClick={() => handleDecline(record.projectId, record.projectName)}
          />
        </Space>
      ),
    },
  ];

  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam === "1" || tabParam === "2") {
      setActiveTab(tabParam);
    }
  }, [location]);

  useEffect(() => {
    if (Array.isArray(projects.data)) {
      let newOrderedProjects = [...projects.data];
      if (selectedProjectToTop && activeTab === "1") {
        const { projectId } = selectedProjectToTop;
        const projectIndex = newOrderedProjects.findIndex((p) => p.projectId === projectId);
        if (projectIndex !== -1) {
          const [selectedProj] = newOrderedProjects.splice(projectIndex, 1);
          newOrderedProjects.unshift(selectedProj);
        } else {
          console.warn(`Project with ID ${projectId} not found in "Dự án cần duyệt".`);
        }
      }
      setOrderedProjects(newOrderedProjects);
    } else {
      setOrderedProjects([]);
    }
  }, [projects.data, selectedProjectToTop, activeTab]);

  useEffect(() => {
    setOrderedChangingProjects(Array.isArray(changingProjects) ? changingProjects : []);
    if (selectedProjectToTop && activeTab === "2") {
      const { projectId } = selectedProjectToTop;
      const projectIndex = changingProjects.findIndex((p) => p.projectId === projectId);
      if (projectIndex !== -1) {
        const reordered = [...changingProjects];
        const [selectedProj] = reordered.splice(projectIndex, 1);
        reordered.unshift(selectedProj);
        setOrderedChangingProjects(reordered);
      } else {
        console.warn(`Project with ID ${projectId} not found in "Dự án cập nhật lại".`);
      }
    }
  }, [changingProjects, selectedProjectToTop, activeTab]);

  return (
    <div style={{ padding: "24px" }}>
      <Tabs
        activeKey={activeTab}
        defaultActiveKey="1"
        onChange={(key) => setActiveTab(key)}
      >
        <TabPane
          tab={
            <Badge
              showZero
              style={{ backgroundColor: "#62b6cb", transform: "scale(0.8)" }}
              count={projects.total}
              offset={[20, -7]}
            >
              Dự án cần duyệt
            </Badge>
          }
          key="1"
        >
          <h4 style={{ marginBottom: 30 }}>Danh sách dự án cần duyệt</h4>
          <Table
            columns={columns}
            dataSource={Array.isArray(orderedProjects) ? orderedProjects : []}
            rowKey="projectId"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "Chưa có dự án nào cần duyệt" }}
            loading={false}
          />
        </TabPane>

        <TabPane
          tab={
            <Badge
              showZero
              style={{ backgroundColor: "#62b6cb", transform: "scale(0.8)" }}
              count={changingProjects.length}
              offset={[20, -7]}
            >
              Dự án cập nhật lại
            </Badge>
          }
          key="2"
        >
          <h4 style={{ marginBottom: 30 }}>Danh sách dự án cập nhật lại</h4>
          <Table
            columns={columns}
            dataSource={Array.isArray(orderedChangingProjects) ? orderedChangingProjects : []}
            rowKey="projectId"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "Chưa có dự án nào cần cập nhật lại" }}
            loading={false}
          />
        </TabPane>
      </Tabs>

      <Modal
        title={`Từ chối dự án: ${selectedProject?.projectName || ""}`}
        open={isDeclineModalVisible}
        onOk={handleDeclineOk}
        onCancel={handleDeclineCancel}
        okText="Đồng ý"
        cancelText="Hủy"
      >
        <Input.TextArea
          placeholder="Nhập lý do từ chối..."
          value={declineMessage}
          onChange={(e) => dispatch(setDeclineMessage(e.target.value))}
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default ProjectRequest;
