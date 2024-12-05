import React, { useState, useEffect } from "react";
import {
  Tree,
  Button,
  Upload,
  message,
  Modal,
  Progress,
  Tooltip,
  Empty,
} from "antd";
import {
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import "../../style/Activity/materialActivity.css";

const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return (
        <FileImageOutlined style={{ fontSize: "16px", color: "#52c41a" }} />
      );
    case "pdf":
      return <FilePdfOutlined style={{ fontSize: "16px", color: "#f5222d" }} />;
    case "doc":
    case "docx":
      return (
        <FileWordOutlined style={{ fontSize: "16px", color: "#1890ff" }} />
      );
    default:
      return <FileOutlined style={{ fontSize: "16px", color: "#8c8c8c" }} />;
  }
};

const MaterialList = ({ selectedClassId }) => {
  const [materials, setMaterials] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [noMaterials, setNoMaterials] = useState(false);

  const jwt = localStorage.getItem("jwt");
  const config = {
    headers: { Authorization: `Bearer ${jwt}` },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setUploadPercent(percentCompleted);
    },
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchMaterials(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchMaterials = async (classId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity?classId=${classId}`,
        config
      );
      const allMaterials = response.data.filter(
        (activity) => activity.activityType === "material"
      );

      if (allMaterials.length === 0) {
        setNoMaterials(true);
      } else {
        setNoMaterials(false);
        const docs = allMaterials.filter((m) =>
          ["doc", "docx", "pdf"].includes(m.materialUrl.split(".").pop())
        );
        const images = allMaterials.filter((m) =>
          ["jpg", "jpeg", "png", "gif"].includes(m.materialUrl.split(".").pop())
        );

        setMaterials([
          {
            title: (
              <span>
                Tài liệu{" "}
                <span
                  style={{
                    backgroundColor: "#52c41a",
                    borderRadius: "50%",
                    display: "inline-block",
                    textAlign: "center",
                    color: "#fff",
                    minWidth: "24px",
                  }}
                >
                  {docs.length}
                </span>
              </span>
            ),
            key: "Tài liệu",
            children: docs.map((doc, i) => ({
              title: doc.materialUrl.split("/").pop(),
              key: `docs-${i}`,
              icon: getFileIcon(doc.materialUrl),
              materialUrl: doc.materialUrl,
            })),
          },
          {
            title: (
              <span>
                Hình ảnh{" "}
                <span
                  style={{
                    backgroundColor: "#52c41a",
                    borderRadius: "50%",
                    display: "inline-block",
                    textAlign: "center",
                    color: "#fff",
                    minWidth: "24px",
                  }}
                >
                  {images.length}
                </span>
              </span>
            ),
            key: "Hình ảnh",
            children: images.map((img, i) => ({
              title: img.materialUrl.split("/").pop(),
              key: `images-${i}`,
              icon: getFileIcon(img.materialUrl),
              materialUrl: img.materialUrl,
            })),
          },
        ]);
      }
    } catch (error) {
      setNoMaterials(true);
      message.error("Error fetching materials.");
    }
  };

  const handleDownload = async (materialUrl) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity/download/${materialUrl
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
      message.error("Error downloading the file.");
    }
  };

  const checkIfFileExists = async (fileName) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity/checkFileExists?fileName=${fileName}&classId=${selectedClassId}`,
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
      message.error(
        `Tệp "${file.name}" đã tồn tại. Đổi tên trước khi tải lên.`
      );
      return;
    }

    const formData = new FormData();
    formData.append("materialFile", file);
    formData.append("classId", selectedClassId);
    formData.append("activityType", "material");

    try {
      setUploading(true);
      await axios.post(`${BASE_URL}/activity`, formData, config);
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

  return (
    <div className="material-box">
      <div className="material-header">
        <span className="material-title">Tài liệu</span>
        <CloudUploadOutlined
          style={{ fontSize: "20px", cursor: "pointer" }}
          onClick={() => setIsModalVisible(true)}
        />
      </div>
      {noMaterials ? (
        <p>Không có tài liệu</p>
      ) : (
        <Tree
          style={{
            backgroundColor: "#f5f5f5",
          }}
          showLine={{ showLeafIcon: true }}
          showIcon={false}
          defaultExpandedKeys={["Tài liệu", "Hình ảnh"]}
          treeData={materials}
          defaultExpandAll
          titleRender={(nodeData) => (
            <Tooltip title={`File: ${nodeData.title}`}>
              <div
                onClick={() => handleDownload(nodeData.materialUrl)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  maxWidth: "150px",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <span style={{ marginRight: "8px" }}>{nodeData.icon}</span>
                <span
                  style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                  }}
                  className="tree-node-title"
                >
                  {nodeData.title}
                </span>
              </div>
            </Tooltip>
          )}
        />
      )}
      <Modal
        title="Tải lên thư mục mới"
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
            Tải lên
          </Button>,
        ]}
      >
        <Upload.Dragger
          beforeUpload={(file) => {
            setFileToUpload(file);
            return false;
          }}
          fileList={fileToUpload ? [fileToUpload] : []}
        >
          <p className="ant-upload-drag-icon">
            <CloudUploadOutlined style={{ fontSize: "48px" }} />
          </p>
          <p className="ant-upload-text">Kéo & thả 1 tệp ở đây</p>
          <p className="ant-upload-hint">
            Hỗ trợ .docx, .pdf, .jpg, và các tệp khác.
          </p>
        </Upload.Dragger>
        {fileToUpload && (
          <div>
            <p>
              <strong>Tên:</strong> {fileToUpload.name}
            </p>
            <p>
              <strong>Kích cỡ:</strong>{" "}
              {(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        )}
        {uploading && <Progress percent={uploadPercent} status="active" />}
      </Modal>
    </div>
  );
};

export default MaterialList;
