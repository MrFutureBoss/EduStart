import { Modal } from "antd";

const SmallModal = ({
  title,
  content,
  footer,
  isModalOpen,
  handleOk,
  handleCancel,
}) => {
  return (
    <Modal
      title={title}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={footer}
    >
      {content}
    </Modal>
  );
};
export default SmallModal;
