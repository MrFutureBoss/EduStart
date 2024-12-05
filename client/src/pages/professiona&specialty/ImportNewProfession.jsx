import React, { useState } from "react";
import SmallModal from "../../components/Modal/SmallModal";
import { Upload, Button, Table, message, Row, Col, Typography } from "antd";
import { UploadOutlined, FileOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue.js";
import ConfirmButton from "../../components/Button/ConfirmButton.jsx";
import CancelButton from "../../components/Button/CancelButton.jsx";

const createSampleFile = () => {
  // Dữ liệu mẫu
  const sampleData = [
    {
      "Tên lĩnh vực": "Công nghệ thông tin",
      "Tên chuyên môn": "Lập trình Web, Lập trình Mobile",
    },
  ];

  // Tạo workbook và worksheet
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Mẫu");

  // Ghi file và tạo link tải
  const fileData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([fileData], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  return url;
};

const ImportNewProfession = ({ open, close }) => {
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateRow = (row) => {
    const errors = [];
    if (!row.profession || row.profession.trim().length < 2) {
      errors.push("Tên lĩnh vực phải có ít nhất 2 ký tự.");
    }
    if (row.specialties) {
      const specialtiesArray = row.specialties.split(",").map((s) => s.trim());
      if (specialtiesArray.some((specialty) => specialty.length < 2)) {
        errors.push("Tên chuyên môn phải có ít nhất 2 ký tự.");
      }
    }
    return errors;
  };

  const handleFileUpload = (file) => {
    // Kiểm tra định dạng file
    const isXlsx =
      file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!isXlsx) {
      message.error("Chỉ được phép tải lên file định dạng .xlsx!");
      return false; // Ngăn chặn upload
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      // Đọc dữ liệu từ sheet
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: ["profession", "specialties"],
      });

      const processedData = sheetData.map((row) => ({
        ...row,
        errors: validateRow(row), // Validate từng dòng
      }));

      setPreviewData(processedData);
    };
    reader.readAsArrayBuffer(file);
    return false; // Ngăn chặn xử lý upload mặc định
  };

  const handleUpload = async () => {
    const validData = previewData.filter((row) => row.errors.length === 0);
    if (validData.length === 0) {
      message.error("Không có dữ liệu hợp lệ để upload.");
      return;
    }

    const formattedData = validData.map((row) => ({
      name: row.profession,
      specialties: row.specialties
        ? row.specialties
            .split(",")
            .map((s) => ({ name: s.trim(), status: false }))
        : [],
      status: false,
    }));

    setIsUploading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/profession/bulk`,
        formattedData
      );
      if (response.status === 200 || response.status === 201) {
        message.success("Dữ liệu đã được upload thành công.");
        close();
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi upload dữ liệu.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const columns = [
    {
      title: "Tên lĩnh vực",
      dataIndex: "profession",
      key: "profession",
    },
    {
      title: "Tên chuyên môn",
      dataIndex: "specialties",
      key: "specialties",
    },
    {
      title: "Lỗi",
      dataIndex: "errors",
      key: "errors",
      render: (errors) =>
        errors && errors.map((error, index) => <p key={index}>{error}</p>),
    },
  ];

  const modalContent = (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Upload
        beforeUpload={handleFileUpload}
        accept=".xlsx, .xls"
        maxCount={1}
        showUploadList={true}
      >
        <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
      </Upload>
      <div style={{ marginTop: "10px" }}>
        <Typography.Text type="secondary" style={{ fontSize: "14px" }}>
          Chỉ nhận file định dạng <strong>.xlsx</strong>. Nếu chưa có, bạn có
          thể tải{" "}
          <Button
            type="link"
            href={createSampleFile()}
            download="file_mau.xlsx"
            style={{ padding: 0 }}
          >
            file mẫu tại đây
          </Button>
          .
        </Typography.Text>
      </div>
      {previewData.length > 0 && (
        <Table
          dataSource={previewData}
          columns={columns}
          rowKey="profession"
          pagination={{ pageSize: 5 }}
          style={{ marginTop: "20px" }}
        />
      )}
    </div>
  );

  const modalFooter = (
    <div style={{ display: "flex", justifyContent: "end", gap: "10px" }}>
      <ConfirmButton
        content="Upload"
        onClick={handleUpload}
        disabled={isUploading || previewData.length === 0}
        loading={isUploading}
      />
      <CancelButton content="Đóng" onClick={close} />
    </div>
  );

  return (
    <SmallModal
      title="Thêm dữ liệu mới bằng file xlsx"
      content={modalContent}
      footer={modalFooter}
      isModalOpen={open}
      handleCancel={close}
      closeable
    />
  );
};

export default ImportNewProfession;
