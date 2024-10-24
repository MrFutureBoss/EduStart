import React, { useState, useEffect } from "react";
import {
  Tree,
  Button,
  Upload,
  message,
  Modal,
  Progress,
  Layout,
  Dropdown,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  CloudUploadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileOutlined,
  DownloadOutlined,
  FolderOutlined,
  CarryOutOutlined,
  FormOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassList } from "../../redux/slice/ClassSlice";

// Function to return the correct file icon based on file extension
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
      return <FilePdfOutlined style={{ fontSize: "24px", color: "#f5222d" }} />;
    case "doc":
    case "docx":
      return (
        <FileWordOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
      );
    case "folder":
      return <FolderOutlined style={{ fontSize: "24px", color: "#faad14" }} />;
    default:
      return <FileOutlined style={{ fontSize: "24px", color: "#8c8c8c" }} />;
  }
};

const getFileType = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
      return "Image File";
    case "pdf":
      return "PDF Document";
    case "doc":
    case "docx":
      return "Word 2007 Document";
    default:
      return extension.toUpperCase();
  }
};

const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState("");

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
  }, [userId, config, dispatch, classList.length]);

  const fetchMaterials = async (classId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity?classId=${classId}`,
        config
      );
      const allMaterials = response.data.filter(
        (activity) => activity.activityType === "material"
      );

      const docs = allMaterials.filter((material) =>
        ["doc", "docx", "pdf"].includes(material.materialUrl.split(".").pop())
      );
      const images = allMaterials.filter((material) =>
        ["jpg", "jpeg", "png", "gif"].includes(
          material.materialUrl.split(".").pop()
        )
      );

      const treeData = [
        {
          title: "Docs",
          key: "docs",
          // switcherIcon: <FormOutlined />,
          children: docs.map((doc, index) => ({
            title: doc.materialUrl.split("/").pop(),
            key: `docs-${index}`,
            icon: getFileIcon(doc.materialUrl),
            materialUrl: doc.materialUrl,
            type: getFileType(doc.materialUrl),
          })),
        },
        {
          title: "Images",
          key: "images",
          // switcherIcon: <FormOutlined />,
          children: images.map((img, index) => ({
            title: img.materialUrl.split("/").pop(),
            key: `images-${index}`,
            icon: getFileIcon(img.materialUrl),
            materialUrl: img.materialUrl,
            type: getFileType(img.materialUrl),
          })),
        },
      ];

      setMaterials(treeData);
    } catch (error) {
      message.error("Error fetching materials");
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchMaterials(selectedClassId);
    }
  }, [selectedClassId, config]);

  const checkIfFileExists = async (filename) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity/checkFileExists?fileName=${filename}&classId=${selectedClassId}`,
        config
      );
      return response.data.exists;
    } catch (error) {
      message.error("Error checking file existence");
      return false;
    }
  };

  const uploadFile = async (file) => {
    const fileExists = await checkIfFileExists(file.name);
    if (fileExists) {
      message.error(`File "${file.name}" already exists. Please rename.`);
      return;
    }

    const formData = new FormData();
    formData.append("materialFile", file);
    formData.append("classId", selectedClassId);
    formData.append("activityType", "material");

    try {
      setUploading(true);
      const response = await axios.post(
        `${BASE_URL}/activity`,
        formData,
        config
      );
      message.success(`${file.name} uploaded successfully.`);
      setFileToUpload(null);
      fetchMaterials(selectedClassId);
    } catch (error) {
      message.error(`${file.name} failed to upload.`);
    } finally {
      setUploading(false);
      setIsModalVisible(false);
    }
  };

  const handleUpload = async () => {
    if (fileToUpload) {
      await uploadFile(fileToUpload);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setFileToUpload(null);
  };

  const handleAddNewMaterial = () => {
    setFileToUpload(null);
    setIsModalVisible(true);
  };

  const uploadProps = {
    beforeUpload: (file) => {
      setFileToUpload(file);
      return false;
    },
  };

  const handleDownload = async (materialUrl) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity/download?filename=${materialUrl
          .split("/")
          .pop()}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", materialUrl.split("/").pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error("Error downloading the file");
    }
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
      <div style={{ padding: "24px", width: "100%" }}>
        <h1>Materials List</h1>

        <Dropdown menu={classMenu} trigger={["click"]}>
          <Button style={{ marginBottom: "16px" }}>
            {selectedClassName
              ? `Selected Class: ${selectedClassName}`
              : "Select a class"}
          </Button>
        </Dropdown>

        <Tree
          showLine={{ showLeafIcon: true }}
          showIcon={true}
          defaultExpandedKeys={["docs"]}
          treeData={materials}
          titleRender={(nodeData) => (
            <Tooltip title={`File: ${nodeData.title}`}>
              <span onClick={() => handleDownload(nodeData.materialUrl)}>
                {nodeData.title} {/* Đã loại bỏ nodeData.icon */}
              </span>
            </Tooltip>
          )}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ marginTop: "16px", width: "16%" }}
          onClick={handleAddNewMaterial} // Reset form và mở modal
          disabled={!selectedClassId}
        >
          Add New Material
        </Button>

        <Modal
          title="Upload New File"
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={handleUpload}
              disabled={!fileToUpload}
              loading={uploading}
            >
              Upload
            </Button>,
          ]}
        >
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ fontSize: "48px" }} />
            </p>
            <p className="ant-upload-text">Drag & drop a file here</p>
            <p className="ant-upload-hint">
              Supports .docx, .pdf, .jpg, and other file types.
            </p>
          </Upload.Dragger>
          {fileToUpload && (
            <div>
              <p>
                <strong>File Name:</strong> {fileToUpload.name}
              </p>
              <p>
                <strong>Type:</strong> {getFileType(fileToUpload.name)}
              </p>
              <p>
                <strong>Size:</strong>{" "}
                {(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
          {uploading && (
            <Progress
              percent={uploadPercent}
              status={uploading ? "active" : "normal"}
            />
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default MaterialList;
