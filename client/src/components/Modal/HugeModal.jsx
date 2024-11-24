import { Modal } from "antd";

const HugeModal = ({
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
      width={1400}
    >
      {content}
    </Modal>
  );
};
export default HugeModal;
