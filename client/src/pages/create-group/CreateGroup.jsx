import React, { useState } from "react";
import CustomModal from "../../components/Modal/LargeModal.jsx";
import ConfirmModal from "../../components/Modal/ConfirmModal.jsx";
import { Button } from "react-bootstrap";
import { Col, DatePicker, Form, Row, Select, Slider } from "antd";

const { RangePicker } = DatePicker;

const CreateGroup = ({ show, close }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = async () => {};
  const handleConfirmSubmit = async () => {};
  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };
  const handleClose = () => {
    close();
  };

  const modalHeader = (
    <>
      <h3 style={{ color: "#FFF" }}>Tạo nhóm cho lớp</h3>
    </>
  );

  const modalBody = (
    <Row>
      <Col sm={10}>
        <h6>Thông tin về lớp mà bạn cần biết</h6>
        <p>Số lượng sinh viên trong lớp: </p>
        <p>Thống kê về chuyên ngành trong lớp:</p>
      </Col>
      <Col sm={14} style={{ display: "flex", justifyContent: "center" }}>
        <Form
          layout="horizontal"
          // disabled={componentDisabled}
          style={
            {
              // maxWidth: 800,
            }
          }
        >
          <Form.Item label="Chọn quy luật tham gia nhóm">
            <Select style={{ zIndex: 2 }}>
              <Select.Option value="2-majors">
                2 chuyên ngành khác nhau cùng 1 nhóm
              </Select.Option>
              <Select.Option value="demo">Demo</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Chọn thời gian kết thúc">
            <DatePicker style={{ zIndex: 2 }} />
          </Form.Item>
          {/* <Form.Item label="Chọn thời gian bắt đầu và kết thúc">
            <RangePicker />
          </Form.Item> */}
          <Form.Item label="Số lượng nhóm">
            <Slider min={5} max={10} defaultValue={5} />
          </Form.Item>
        </Form>
      </Col>
    </Row>
  );

  const modalFooter = (
    <>
      <Button
        variant="success"
        onClick={handleConfirmSubmit}
        // disabled={!isFormValid}
      >
        Tạo
      </Button>
      <Button variant="danger" onClick={handleClose}>
        Thoát
      </Button>
    </>
  );

  return (
    <>
      <CustomModal
        show={show}
        onHide={close}
        title={modalHeader}
        content={modalBody}
        footer={modalFooter}
      />
      <ConfirmModal
        show={showConfirmModal}
        title="Xác nhận tạo nhóm"
        content="Bạn có chắc chắn muốn tạo nhóm với những điều kiện này không?"
        onConfirm={handleSubmit}
        onCancel={handleCancelSubmit}
      />
    </>
  );
};

export default CreateGroup;
