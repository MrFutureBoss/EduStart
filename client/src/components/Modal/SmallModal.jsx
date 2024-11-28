import { Modal } from "antd";

const SmallModal = ({
  title,
  content,
  footer,
  isModalOpen,
  handleOk,
  handleCancel,
  closeable,
}) => {
  const headerModal = <p className="modal-title-custom">{title}</p>;
  return (
    <Modal
      title={headerModal}
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
