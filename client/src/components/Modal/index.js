import React from "react";
import { Modal } from "antd";

const CustomModal = ({ title, content, width, open, onOk, onCancel, footer }) => {
  return (
    <Modal
      title={title}
      centered
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      width={width}
      footer={footer}
    >
      {content}
    </Modal>
  );
};

export default CustomModal;
