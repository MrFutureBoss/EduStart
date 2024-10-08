import React, { useState } from "react";
import CustomModal from "../components/Modal/LargeModal.js";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { Checkbox, Tag } from "antd";
import "../style/Admin/Profession.css";
import {
  CloseCircleOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { message, Upload } from "antd";

const AddNewProfession = ({ show, close }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState();
  const [specialties, setSpecialties] = useState([]); // Trạng thái lưu danh sách chuyên môn
  const [specialtyInput, setSpecialtyInput] = useState(""); // Trạng thái lưu giá trị nhập hiện tại

  // Hàm để đọc file ảnh và chuyển thành base64
  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
  };

  const handleChange = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      getBase64(info.file.originFileObj, (url) => {
        setLoading(false);
        setImageUrl(url);
      });
    }
  };

  const handleSpecialtyInputChange = (e) => {
    setSpecialtyInput(e.target.value);
  };

  // Hàm xử lý khi nhấn Enter để thêm chuyên môn vào danh sách
  const handleSpecialtyKeyDown = (e) => {
    if (e.key === "Enter" && specialtyInput.trim() !== "") {
      setSpecialties([...specialties, specialtyInput.trim()]); // Thêm chuyên môn vào danh sách
      setSpecialtyInput(""); // Reset lại input sau khi thêm
      e.preventDefault(); // Ngăn sự kiện Enter gây ra submit form
    }
  };

  const handleRemoveSpecialty = (removedSpecialty) => {
    setSpecialties(
      specialties.filter((specialty) => specialty !== removedSpecialty)
    );
  };

  const uploadButton = (
    <button
      style={{
        border: 0,
        background: "none",
      }}
      type="button"
    >
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div
        style={{
          marginTop: 8,
        }}
      >
        Tải ảnh lên
      </div>
    </button>
  );

  //Pop-up Add Profession Screen
  //Header Content
  const modalHeader = (
    <>
      <h3 style={{ color: "#FFF" }}>Thêm lĩnh vực mới</h3>
    </>
  );

  //Modal Body
  const modalBody = (
    <Container fluid>
      <Row>
        <Col sm={8}>
          <Form>
            <Form.Group
              style={{ marginBottom: "20px" }}
              controlId="formProfessionName"
            >
              <Form.Label style={{ fontWeight: "600" }}>
                Tên lĩnh vực:
              </Form.Label>
              <Form.Control type="text" placeholder="Trí tuệ nhân tạo" />
            </Form.Group>
            <Form.Group
              style={{ marginBottom: "10px" }}
              controlId="formSpecializationName"
            >
              <Form.Label style={{ fontWeight: "600" }}>
                Tên chuyên môn:
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Deep fake"
                value={specialtyInput}
                onChange={handleSpecialtyInputChange}
                onKeyDown={handleSpecialtyKeyDown} // Bắt sự kiện nhấn Enter
              />
              <small className="hint_addspecialty">
                (*) Nếu thêm 1 chuyên môn mới hãy nhấn enter để lưu khi nhập
                xong
              </small>
            </Form.Group>
            <Form.Group style={{ marginBottom: "10px" }}>
              <div style={{display:'flex'}}>
                {specialties.map((specialty, index) => (
                  <Tag
                    className="speicalty_tag"
                    key={index}
                    closeIcon={
                      <CloseCircleOutlined
                        style={{ fontSize: "15px", color: "#fff" }}
                      />
                    }
                    closable
                    onClose={() => handleRemoveSpecialty(specialty)} // Cho phép xóa thẻ
                  >
                    {specialty}
                  </Tag>
                ))}
              </div>
            </Form.Group>
          </Form>
          <Checkbox style={{ fontWeight: "500" }}>Cho hoạt động</Checkbox>
        </Col>
        <Col
          sm={4}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Upload
            name="avatar"
            listType="picture-circle"
            className="avatar-uploader"
            showUploadList={false}
            action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
            beforeUpload={beforeUpload}
            onChange={handleChange}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="avatar"
                style={{
                  width: "100%",
                }}
              />
            ) : (
              uploadButton
            )}
          </Upload>
        </Col>
      </Row>
    </Container>
  );

  //Footer button
  const modalFooter = (
    <>
      <Button variant="success">Thêm Vào</Button>
      <Button variant="danger" onClick={close}>
        Thoát
      </Button>
    </>
  );

  return (
    <CustomModal
      show={show}
      onHide={close}
      title={modalHeader}
      content={modalBody}
      footer={modalFooter}
    />
  );
};

export default AddNewProfession;
