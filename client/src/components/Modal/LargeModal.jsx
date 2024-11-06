import React from "react";
import Modal from "react-bootstrap/Modal";
import "./CustomModal.css";
const CustomModal = ({ show, onHide, title, content, footer }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      dialogClassName="custom-modal"
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header className="modal-header-custom">
        <Modal.Title className="modal-title-custom">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{content}</Modal.Body>
      <Modal.Footer>{footer}</Modal.Footer>
    </Modal>
  );
};

export default CustomModal;
