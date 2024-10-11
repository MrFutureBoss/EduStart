import { useEffect, useState } from "react";
import CustomModal from "../../components/Modal/LargeModal.jsx";
import ConfirmModal from "../../components/Modal/ConfirmModal.jsx";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { Checkbox, Tag, message } from "antd";
import "../../style/Admin/Profession.css";
import { CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import { setProfessions } from "../../redux/slice/ProfessionSlice.js";

const EditProfession = ({ _id, show, close }) => {
  const dispatch = useDispatch();
  const professions = useSelector((state) => state.profession.professions.data);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [professionName, setProfessionName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const MAX_LENGTH = 30;
  const REGEX =
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơưẠ-ỹ\s-]+$/u;
  console.log("ID:" + _id);

  const [professionData, setProfessionData] = useState({
    name: "",
    specialties: [],
    status: false,
  });

  // Hàm lấy dữ liệu profession theo ID
  const getProfessionById = async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/profession/${id}`);
      const fetchedData = response.data;

      // Cập nhật state với dữ liệu lấy được
      setProfessionData({
        name: fetchedData.name || "",
        specialties: fetchedData.specialties || [],
        status: fetchedData.status || false,
      });
    } catch (err) {
      message.error("Có lỗi xảy ra khi lấy dữ liệu lĩnh vực.");
    }
  };

  useEffect(() => {
    if (_id) {
      getProfessionById(_id);
    }
  }, [_id]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProfessionData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  console.log("Name:" + professionData?.specialty);

  const handleSubmit = async () => {
    // Validate data before sending
    if (professionName.length < 2 || professionName.length > MAX_LENGTH) {
      message.warning(`Tên lĩnh vực phải từ 2 đến ${MAX_LENGTH} ký tự.`);
      return;
    }

    if (!REGEX.test(professionName)) {
      message.error("Tên lĩnh vực không được chứa số hoặc ký tự đặc biệt.");
      return;
    }

    const data = {
      name: professionName,
      status: isActive,
      specialties:
        specialties.length > 0
          ? specialties.map((specialty) => ({
              name: specialty,
              status: isActive,
            }))
          : [],
    };

    try {
      const response = await axios.post(`${BASE_URL}/profession`, data);

      if (response.status === 201 || response.status === 200) {
        message.success("Đã thêm lĩnh vực thành công.");

        const newProfession = response.data;
        const updatedProfessions = {
          data: [newProfession, ...professions],
          total: professions.length + 1,
        };
        dispatch(setProfessions(updatedProfessions));

        // Reset form
        setProfessionName("");
        setSpecialties([]);
        setIsActive(false);

        setShowConfirmModal(false);
        close();
      } else {
        message.error("Có lỗi xảy ra khi thêm lĩnh vực.");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi thêm lĩnh vực.");
      console.error("Error adding profession:", error);
    }
  };

  //Hàm xử lý nhập chuyên môn
  const handleSpecialtyInputChange = (e) => {
    const value = e.target.value.normalize("NFC");
    //  Validate giới hạn ký tự
    if (value.length <= MAX_LENGTH) {
      setSpecialtyInput(value);
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
    const value = e.target.value.normalize("NFC"); // Normalize the input
    setProfessionName(value);
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

    setProfessionName(value);
  };

  //Pop-up xác nhận thêm vào hay không
  const handleConfirmSubmit = () => {
    setShowConfirmModal(true);
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  const handleDeleteAll = async () => {
    if (!_id) {
      message.error("Không thể xóa vì không có ID lĩnh vực.");
      return;
    }

    try {
      const response = await axios.delete(`${BASE_URL}/profession/${_id}`);

      if (response.status === 200 || response.status === 204) {
        message.success("Đã xóa lĩnh vực và chuyên môn thành công.");
        const updatedProfessions = professions.filter(
          (profession) => profession._id !== _id
        );
        dispatch(
          setProfessions({
            data: updatedProfessions,
            total: updatedProfessions.length,
          })
        );
        close();
      } else {
        message.error("Có lỗi xảy ra khi xóa lĩnh vực.");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa lĩnh vực.");
      console.error("Error deleting profession and specialties:", error);
    }
  };

  //Pop-up thêm chuyên môn và lĩnh vực
  //Header Content
  const modalHeader = (
    <>
      <h4 style={{ color: "#FFF" }}>Cập nhật lĩnh vực và chuyên môn</h4>
    </>
  );

  //Modal Body
  const modalBody = (
    <Container fluid>
      <Row>
        <Col style={{ margin: "auto" }} sm={10}>
          <Form>
            <Form.Group
              style={{ marginBottom: "20px" }}
              controlId="formProfessionName"
            >
              <Form.Label style={{ fontWeight: "600" }}>
                Tên lĩnh vực:
              </Form.Label>
              <Form.Control
                style={{ marginBottom: "5px" }}
                type="text"
                placeholder="Công nghệ thông tin"
                value={professionData.name}
                name="name"
                onChange={handleFormChange}
                onKeyDown={handleProfessionNameKeyDown}
              />
              <small
                className="limitwords"
                style={{
                  display: professionName.length === 0 ? "none" : "block",
                }}
              >
                {professionName.length > 1 &&
                professionName.length <= MAX_LENGTH ? (
                  <CheckCircleOutlined style={{ color: "green" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "red" }} />
                )}
                &nbsp;Giới hạn kí tự nhập:
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
              <small
                className="limitwords"
                style={{
                  display: professionName.length === 0 ? "none" : "block",
                }}
              >
                {REGEX.test(professionName) ? (
                  <CheckCircleOutlined style={{ color: "green" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "red" }} />
                )}
                &nbsp;Không bao gồm số và kí tự đặc biệt
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
                placeholder="Lập trình Web"
                value={specialtyInput}
                onChange={handleSpecialtyInputChange}
                onKeyDown={handleSpecialtyKeyDown}
                style={{ marginBottom: "5px" }}
              />
              <small
                className="limitwords"
                style={{
                  display: specialtyInput.length === 0 ? "none" : "block",
                }}
              >
                {specialtyInput.length > 1 &&
                specialtyInput.length <= MAX_LENGTH ? (
                  <CheckCircleOutlined style={{ color: "green" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "red" }} />
                )}
                &nbsp;Giới hạn kí tự nhập:
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
              <small
                className="limitwords"
                style={{
                  display: specialtyInput.length === 0 ? "none" : "block",
                }}
              >
                {REGEX.test(specialtyInput) ? (
                  <CheckCircleOutlined style={{ color: "green" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "red" }} />
                )}
                &nbsp;Không bao gồm số và kí tự đặc biệt
              </small>
              <small className="hint_addspecialty">
                (*) Nếu thêm 1 chuyên môn mới hãy nhấn enter để lưu khi nhập
                xong
              </small>
            </Form.Group>
            <Form.Group style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex" }}>
                {professionData.specialties.map((sp, index) => (
                  <Tag
                    className="speicalty_tag"
                    key={index}
                    closeIcon={
                      <CloseCircleOutlined
                        style={{ fontSize: "15px", color: "#fff" }}
                      />
                    }
                    closable
                    onClose={() => handleRemoveSpecialty(sp._id)}
                  >
                    {sp.name}
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
      </Row>
    </Container>
  );

  //Footer button
  const modalFooter = (
    <>
      <Button variant="success" onClick={handleConfirmSubmit}>
        Cập nhật
      </Button>
      <Button variant="danger" onClick={() => setShowDeleteConfirmModal(true)}>
        Xóa tất cả
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
      <ConfirmModal
        show={showDeleteConfirmModal}
        title="Xác nhận xóa"
        content="Bạn có chắc chắn muốn xóa lĩnh vực và tất cả các chuyên môn liên quan không?"
        onConfirm={() => {
          handleDeleteAll();
          setShowDeleteConfirmModal(false);
        }}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />
    </>
  );
};

export default EditProfession;
