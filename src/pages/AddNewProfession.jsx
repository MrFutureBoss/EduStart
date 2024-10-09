import { useEffect, useState } from "react";
import CustomModal from "../components/Modal/LargeModal.jsx";
import ConfirmModal from "../components/Modal/ConfirmModal.jsx";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { Checkbox, Tag, Upload, message } from "antd";
import "../style/Admin/Profession.css";
import {
  CloseCircleOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import axios from "axios";
import { BASE_URL } from "../utilities/initalValue.js";

const AddNewProfession = ({ show, close }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState();
  const [specialties, setSpecialties] = useState([]); // Trạng thái lưu danh sách chuyên môn
  const [specialtyInput, setSpecialtyInput] = useState(""); // Trạng thái lưu giá trị nhập hiện tại
  const [professionName, setProfessionName] = useState(""); // State for profession name
  const [isActive, setIsActive] = useState(false); // State for profession active status
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const MAX_LENGTH = 30; // Đặt giới hạn ký tự nhập cho các label
  const REGEX = /^[a-zA-Z\s]+$/;

  const handleSubmit = async () => {
    if (!professionName) {
      message.error("Vui lòng nhập tên lĩnh vực.");
      return;
    }
  
    const data = {
      name: professionName,
      status: isActive,
      specialties: specialties.length > 0 ? specialties.map((specialty) => ({
        name: specialty,
        status: isActive,
      })) : [],
    };
  
    // Log dữ liệu để kiểm tra
    console.log("Data to be sent:", data);
  
    try {
      const response = await axios.post(`${BASE_URL}/profession`, data);
  
      // Log phản hồi từ server
      console.log("Server response:", response);
  
      if (response.status === 200 || response.status === 201) {
        message.success("Đã thêm lĩnh vực và chuyên môn thành công.");
        setProfessionName("");
        setSpecialties([]); 
        setIsActive(false); 
      } else {
        message.error("Thêm lĩnh vực và chuyên môn thất bại.");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi thêm lĩnh vực và chuyên môn.");
      console.error("Error adding profession and specialties:", error.response || error);
    }
     finally {
      setShowConfirmModal(false);
    }
  };
  

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

  //Hàm xử lý nhập chuyên môn
  const handleSpecialtyInputChange = (e) => {
    const value = e.target.value;

    //  Validate giới hạn ký tự
    if (value.length <= MAX_LENGTH) {
      // Validate chuyên môn không chứa số hoặc ký tự
      if (value !== "" && !REGEX.test(value)) {
        message.error("Tên chuyên môn không được chứa số hoặc ký tự đặc biệt.");
        return; // Ngăn không cho cập nhật nếu có ký tự không hợp lệ
      } else setSpecialtyInput(value);
    } else {
      message.warning(`Tên chuyên môn không được dài quá ${MAX_LENGTH} ký tự.`);
    }
  };

  const handleSpecialtyKeyDown = (e) => {
    if (e.key === "Enter") {
      const trimmedSpecialty = specialtyInput.trim();

      // Validate chuyên môn nhập lớn hơn 1 kí tự
      if (trimmedSpecialty.length <= 1) {
        message.error("Tên chuyên môn phải có độ dài lớn hơn 1 ký tự.");
        e.preventDefault();
        return;
      }

      // Validate chuyên môn không trùng nhau
      if (specialties.includes(trimmedSpecialty)) {
        message.error("Tên chuyên môn lúc thêm đã tồn tại.");
        e.preventDefault(); // Ngăn sự kiện Enter gây ra submit form
        return;
      }

      // Validate chuyên môn không chứa số hoặc ký tự
      if (!REGEX.test(trimmedSpecialty)) {
        message.error("Tên chuyên môn không được chứa số hoặc ký tự đặc biệt.");
        e.preventDefault();
        return;
      }

      setSpecialties([...specialties, trimmedSpecialty]);
      setSpecialtyInput(""); // Reset input after add new
      e.preventDefault();
    }
  };

  const handleRemoveSpecialty = (removedSpecialty) => {
    setSpecialties(
      specialties.filter((specialty) => specialty !== removedSpecialty)
    );
  };

  //Hàm xử lý nhập lĩnh vực
  const handleProfessionNameChange = (e) => {
    const value = e.target.value;

    //  Validate giới hạn ký tự
    if (value.length <= MAX_LENGTH) {
      // Validate tên lĩnh vực không chứa số hoặc ký tự đặc biệt
      if (value !== "" && !REGEX.test(value)) {
        message.error("Tên lĩnh vực không được chứa số hoặc ký tự đặc biệt.");
        e.preventDefault();
        return;
      } else {
        setProfessionName(value);
      }
    } else {
      message.warning(`Tên lĩnh vực không được dài quá ${MAX_LENGTH} ký tự.`);
      e.preventDefault();
    }
  };

  const handleProfessionNameKeyDown = (e) => {
    const value = e.target.value;

    // Kiểm tra nếu số ký tự đã đạt đến giới hạn
    if (
      value.length >= MAX_LENGTH &&
      e.key !== "Backspace" &&
      e.key !== "Delete"
    ) {
      e.preventDefault();
      message.warning(`Tên lĩnh vực không được dài quá ${MAX_LENGTH} ký tự.`);
      return;
    }

    // Kiểm tra ký tự đang nhập có hợp lệ không
    if (!REGEX.test(e.key) && e.key !== "Backspace" && e.key !== "Delete") {
      e.preventDefault();
      message.error("Tên lĩnh vực không được chứa số hoặc ký tự đặc biệt.");
      return;
    }
    setProfessionName(value);
  };

  //Pop-up xác nhận thêm vào hay không
  const handleConfirmSubmit = () => {
    setShowConfirmModal(true);
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  //Pop-up thêm chuyên môn và lĩnh vực
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
              type="text"
              placeholder="Trí tuệ nhân tạo"
              value={professionName}
              onChange={handleProfessionNameChange}
              onKeyDown={handleProfessionNameKeyDown}
            >
              <Form.Label style={{ fontWeight: "600" }}>
                Tên lĩnh vực:
              </Form.Label>
              <Form.Control type="text" placeholder="Trí tuệ nhân tạo" />
              <small
                className="limitwords"
                style={{
                  display: professionName.length === 0 ? "none" : "block",
                }}
              >
                Giới hạn kí tự nhập:{" "}
                <span
                  style={{
                    color:
                      professionName.length >= MAX_LENGTH ? "red" : "green",
                  }}
                >
                  {professionName.length}
                </span>
                /{MAX_LENGTH} ký tự
              </small>
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
                onKeyDown={handleSpecialtyKeyDown}
              />
              <small
                className="limitwords"
                style={{
                  display: specialtyInput.length === 0 ? "none" : "block",
                }}
              >
                Giới hạn kí tự nhập:{" "}
                <span
                  style={{
                    color:
                      specialtyInput.length >= MAX_LENGTH ? "red" : "green",
                  }}
                >
                  {specialtyInput.length}
                </span>
                /{MAX_LENGTH} ký tự
              </small>
              <small className="hint_addspecialty">
                (*) Nếu thêm 1 chuyên môn mới hãy nhấn enter để lưu khi nhập
                xong
              </small>
            </Form.Group>
            <Form.Group style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex" }}>
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
          <Checkbox
            style={{ fontWeight: "500" }}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          >
            Cho hoạt động
          </Checkbox>
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
      <Button variant="success" onClick={handleConfirmSubmit}>
        Thêm Vào
      </Button>
      <Button variant="danger" onClick={close}>
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
        title="Xác nhận"
        content="Bạn có chắc chắn muốn thêm lĩnh vực và chuyên môn không?"
        onConfirm={handleSubmit}
        onCancel={handleCancelSubmit}
      />
    </>
  );
};

export default AddNewProfession;
