// SelectRoleModal.js

import React from "react";
import { Modal, Button } from "antd";
import { UserAddOutlined, UploadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

// Định nghĩa roles nếu cần
const roles = [
  { id: 4, name: "Sinh viên" },
  { id: 2, name: "Giáo viên" },
  { id: 3, name: "Người hướng dẫn" },
  { id: 5, name: "Người dùng khác" },
];

const SelectRoleModal = ({ visible, onManualAdd, onFileUpload, onCancel }) => {
  const selectedRole = useSelector((state) => state.user.selectedRole); // Lấy role từ Redux
  const roleName = selectedRole
    ? roles.find((r) => r.id === selectedRole)?.name
    : "người dùng";

  return (
    <Modal
      title={`Chọn phương thức thêm ${roleName}`}
      visible={visible}
      onCancel={onCancel}
      footer={null}
    >
      <p>Bạn muốn thêm {roleName} bằng cách nào?</p>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <Button key="manual" icon={<UserAddOutlined />} onClick={onManualAdd}>
          Thêm thủ công
        </Button>
        <Button key="upload" icon={<UploadOutlined />} onClick={onFileUpload}>
          Tải file lên
        </Button>
      </div>
    </Modal>
  );
};

export default SelectRoleModal;
