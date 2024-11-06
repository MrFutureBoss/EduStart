import React, { useState } from "react";
import { Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const ProjectImport = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (info) => {
    if (info.file.status === "removed") setFile(null);
    else setFile(info.file.originFileObj);
  };

  const handleUpload = async () => {
    if (!file) {
      message.error("Please select a file first!");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:9999/api/projects/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onImportSuccess(response.data.data); // Pass imported projects to parent
    } catch (error) {
      message.error("Failed to import projects.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <Upload onRemove={() => setFile(null)} beforeUpload={() => false} onChange={handleFileChange}>
        <Button icon={<UploadOutlined />}>Select Excel File</Button>
      </Upload>
      <Button type="primary" onClick={handleUpload} loading={loading} disabled={!file}>
        Import Projects
      </Button>
    </div>
  );
};

export default ProjectImport;
