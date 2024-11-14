import { Modal } from "antd";

const SmallModal = ({
  title,
  content,
  footer,
  isModalOpen,
  handleOk,
  handleCancel,
  closeable
}) => {
  return (
    <Modal
      title={title}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={footer}
      closable={closeable}
    >
      {content}
    </Modal>
  );
};
export default SmallModal;
