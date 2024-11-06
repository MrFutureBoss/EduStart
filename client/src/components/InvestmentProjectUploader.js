import React, { useState } from "react";
import { Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const InvestmentProjectUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      message.error("Please select an Excel file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:9999/api/investments/import", formData);
      message.success(response.data.message || "Investment projects uploaded successfully.");
      onUploadSuccess();
    } catch (error) {
      console.error("Failed to upload investment projects:", error);
      message.error("Failed to upload investment projects.");
    }
  };

  return (
    <div>
      <Upload
        beforeUpload={(file) => {
          setFile(file);
          return false;
        }}
      >
        <Button icon={<UploadOutlined />}>Select File</Button>
      </Upload>
      <Button type="primary" onClick={handleUpload} disabled={!file} style={{ marginTop: 10 }}>
        Upload
      </Button>
    </div>
  );
};

export default InvestmentProjectUploader;
