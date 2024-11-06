import React, { useState, useEffect } from "react";
import {
  List,
  Button,
  Upload,
  message,
  Dropdown,
  Modal,
  Input,
  Progress,
  Layout,
  App,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  FileOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import TeacherSidebar from "./TeacherSidebar";
import { useDispatch, useSelector } from "react-redux";
import { setClassList } from "../../redux/slice/ClassSlice";
import AppHeader from "../../components/Admin/AdminMain";

const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState("");
  const [fileList, setFileList] = useState([]);

  const userId = localStorage.getItem("userId");
  const jwt = localStorage.getItem("jwt");

  const dispatch = useDispatch();
  const classList = useSelector((state) => state.class.classList);

  const config = {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setUploadPercent(percentCompleted);
    },
  };

  useEffect(() => {
    if (classList.length === 0) {
      const fetchClasses = async () => {
        try {
          const response = await axios.get(
            `${BASE_URL}/class/${userId}/user`,
            config
          );
          dispatch(setClassList(response.data));
        } catch (error) {
          message.error("Error fetching classes");
        }
      };
      fetchClasses();
    }
  }, [userId, config, classList, dispatch]);

  useEffect(() => {
    if (selectedClassId) {
      const fetchMaterials = async () => {
        try {
          const response = await axios.get(
            `${BASE_URL}/activity?classId=${selectedClassId}`,
            config
          );
          setMaterials(
            response.data.filter(
              (activity) => activity.activityType === "material"
            )
          );
        } catch (error) {
          message.error("Error fetching materials");
        }
      };
      fetchMaterials();
    }
  }, [selectedClassId, config]);

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return (
          <FileImageOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
        ); 
      case "pdf":
        return (
          <FilePdfOutlined style={{ fontSize: "24px", color: "#f5222d" }} />
        ); 
      case "doc":
      case "docx":
        return (
          <FileWordOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
        );
      case "folder":
        return (
          <FolderOutlined style={{ fontSize: "24px", color: "#faad14" }} />
        ); 
      default:
        return <FileOutlined style={{ fontSize: "24px", color: "#8c8c8c" }} />; 
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload) return;

    const formData = new FormData();
    formData.append("materialFile", fileToUpload);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("activityType", "material");
    formData.append("classId", selectedClassId);

    try {
      setUploading(true);
      const response = await axios.post(
        `${BASE_URL}/activity`,
        formData,
        config
      );
      message.success(`${fileToUpload.name} uploaded successfully.`);
      setMaterials([...materials, response.data]);
    } catch (error) {
      message.error(`${fileToUpload.name} failed to upload.`);
    } finally {
      setUploading(false);
      setUploadPercent(0);
      setFileList([]);
      setIsModalVisible(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setFileToUpload(null);
    setTitle("");
    setDescription("");
  };

  const uploadProps = {
    onRemove: () => {
      setFileToUpload(null);
      setFileList([]);
    },
    beforeUpload: (file) => {
      setFileToUpload(file);
      setFileList([file]);
      return false;
    },
    fileList,
  };

  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const classMenu = {
    items: classList.map((classItem) => ({
      key: classItem._id,
      label: classItem.className,
    })),
    onClick: ({ key }) => {
      const selectedClass = classList.find(
        (classItem) => classItem._id === key
      );
      setSelectedClassId(key);
      setSelectedClassName(selectedClass.className);
    },
  };

  return (
    <Layout>
      <AppHeader collapsed={collapsed} toggleCollapse={toggleCollapse} />
      <Layout>
        <TeacherSidebar collapsed={collapsed} toggleCollapse={toggleCollapse} />

        <div style={{ padding: "24px", width: "100%" }}>
          <h1>Danh sách tài liệu</h1>

          <Dropdown menu={classMenu} trigger={["click"]}>
            <Button style={{ marginBottom: "16px" }}>
              {selectedClassName
                ? `Lớp đã chọn: ${selectedClassName}`
                : "Chọn lớp học"}
            </Button>
          </Dropdown>

          <List
            itemLayout="horizontal"
            dataSource={materials}
            renderItem={(material) => (
              <List.Item>
                <List.Item.Meta
                  avatar={getFileIcon(material.materialUrl.split("/").pop())} 
                  title={<strong>{material.title}</strong>}
                  description={material.description}
                />
                <a
                  href={`/${material.materialUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DownloadOutlined
                    style={{ fontSize: "20px", color: "#1890ff" }}
                  />
                </a>
              </List.Item>
            )}
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ marginTop: "16px" }}
            onClick={() => setIsModalVisible(true)}
            disabled={!selectedClassId}
          >
            Thêm tài liệu mới
          </Button>

          <Modal
            title="Tải tài liệu lên"
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={[
              <Button key="cancel" onClick={handleCancel}>
                Hủy
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={handleUpload}
                disabled={!fileToUpload}
                loading={uploading}
              >
                Tải lên
              </Button>,
            ]}
          >
            <Input
              placeholder="Nhập tiêu đề tài liệu"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginBottom: "16px" }}
            />
            <Input.TextArea
              placeholder="Nhập mô tả tài liệu"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ marginBottom: "16px" }}
            />
            <Upload {...uploadProps} showUploadList={{ showRemoveIcon: true }}>
              <Button icon={<UploadOutlined />}>Chọn tệp để tải lên</Button>
            </Upload>

            {uploading && (
              <Progress
                percent={uploadPercent}
                status={uploading ? "active" : "normal"}
              />
            )}
          </Modal>
        </div>
      </Layout>
    </Layout>
  );
};

export default MaterialList;
