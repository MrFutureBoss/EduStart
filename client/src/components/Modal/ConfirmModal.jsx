import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmModal = ({ show, title, content, onConfirm, onCancel }) => {
  return (
    <Modal show={show} onHide={onCancel} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{title || 'Xác nhận'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{content || 'Bạn có chắc chắn muốn thực hiện hành động này?'}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
