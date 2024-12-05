import { useEffect, useState } from "react";
import CustomModal from "../../components/Modal/LargeModal.jsx";
import ConfirmModal from "../../components/Modal/ConfirmModal.jsx";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { Checkbox, Tag, message } from "antd";
import "../../style/Admin/Profession.css";
import {
  CloseCircleOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  EnterOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import { setProfessions } from "../../redux/slice/ProfessionSlice.js";
import { setSpecialties } from "../../redux/slice/SpecialtySlice.js";
import ConfirmButton from "../../components/Button/ConfirmButton.jsx";
import CancelButton from "../../components/Button/CancelButton.jsx";

const AddNewProfession = ({ show, close }) => {
  const dispatch = useDispatch();
  const professions = useSelector((state) => state.profession.professions.data);
  // const specialtiesData = useSelector(
  //   (state) => state.specialty.specialties.data || []
  // );
  const [isFormValid, setIsFormValid] = useState(false);
  const [specialties, setSpecialtiesData] = useState([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [professionName, setProfessionName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isNameDuplicate, setIsNameDuplicate] = useState(false);
  const [isInvalidWhitespace, setIsInvalidWhitespace] = useState(false);
  const [isOnlyNumber, setIsOnlyNumber] = useState(false);
  const [isNameDuplicate2, setIsNameDuplicate2] = useState(false);
  const [isInvalidWhitespace2, setIsInvalidWhitespace2] = useState(false);
  const [isOnlyNumber2, setIsOnlyNumber2] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const MAX_LENGTH = 30;
  const REGEX =
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơưẠ-ỹ0-9\s-]+$/u;

  //Check điều kiện để được submit thêm vào
  useEffect(() => {
    const isProfessionValid =
      professionName.length > 1 &&
      professionName.length <= MAX_LENGTH &&
      !isInvalidWhitespace &&
      REGEX.test(professionName) &&
      !isNameDuplicate &&
      !isOnlyNumber;

    const isSpecialtyValid =
      specialtyInput.length === 0 ||
      (specialtyInput.length > 1 &&
        specialtyInput.length <= MAX_LENGTH &&
        REGEX.test(specialtyInput) &&
        !isNameDuplicate2 &&
        !isInvalidWhitespace2 &&
        !isOnlyNumber2);

    setIsFormValid(isProfessionValid && isSpecialtyValid);
  }, [
    professionName,
    isInvalidWhitespace,
    isNameDuplicate,
    specialtyInput,
    isNameDuplicate2,
    specialties,
    isInvalidWhitespace2,
    isOnlyNumber2,
  ]);

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
        const specialtiesResponse = await axios.get(`${BASE_URL}/specialty`);
        if (specialtiesResponse.status === 200) {
          dispatch(setSpecialties(specialtiesResponse.data));
        }

        dispatch(setProfessions(updatedProfessions));
        setProfessionName("");
        setSpecialtiesData([]);
        setIsActive(false);

        setShowConfirmModal(false);
        close();
      }
    } catch (error) {
      // Kiểm tra nếu back-end trả về lỗi cụ thể
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        message.error(error.response.data.message); // Hiển thị lỗi từ back-end (VD: "Lĩnh vực đã tồn tại")
      } else {
        message.error("Có lỗi xảy ra khi thêm lĩnh vực.");
      }
      console.error("Error adding profession:", error);
    }
  };

  const resetFormAndClose = () => {
    // Reset các trạng thái của form về mặc định
    setProfessionName("");
    setSpecialties([]);
    setIsActive(false);
    setIsNameDuplicate(false);
    setIsInvalidWhitespace(false);
    setIsOnlyNumber(false);
    setIsNameDuplicate2(false);
    setIsInvalidWhitespace2(false);
    setIsOnlyNumber2(false);
    setShowConfirmModal(false);

    // Đóng modal
    close();
  };

  const handleClose = () => {
    // Nếu có nội dung đã nhập, yêu cầu xác nhận trước khi đóng
    if (professionName.length > 1 || specialtyInput.length > 1) {
      setShowExitConfirmModal(true);
    } else {
      // Nếu không có nội dung, đóng modal và reset trạng thái
      resetFormAndClose();
    }
  };

  //Hàm xử lí chữ cái đầu luôn viết hoa
  const capitalizeEachWord = (str) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
      .join(" ");
  };

  //Hàm xử lý nhập chuyên môn
  const handleSpecialtyInputChange = (e) => {
    let value = e.target.value.normalize("NFC");
    value = capitalizeEachWord(value);
    //Validate giới hạn ký tự
    if (value.length <= MAX_LENGTH) {
      setSpecialtyInput(value);
      //Validate có trùng tên chuyên môn hoặc lĩnh vực nào trong data không
      checkDuplicateSpecialtyName(value);
      //Validate có spam khoảng trắng không
      if (value.length === 0) {
        setIsInvalidWhitespace2(false);
        setIsOnlyNumber2(false);
      } else if (/^\s*$/.test(value) || /\s{2,}/.test(value)) {
        setIsInvalidWhitespace2(true);
      } else {
        setIsInvalidWhitespace2(false);
      }
      // Validate nếu chuỗi chỉ chứa số
      if (/^[0-9\s]+$/.test(value)) {
        setIsOnlyNumber2(true);
      } else {
        setIsOnlyNumber2(false);
      }

      // Reset trạng thái kiểm tra trùng tên
      setIsNameDuplicate2(false);
    } else {
      message.warning(`Tên chuyên môn không được dài quá ${MAX_LENGTH} ký tự.`);
    }
  };

  const handleSpecialtyKeyDown = (e) => {
    if (e.key === "Enter") {
      const trimmedSpecialty = capitalizeEachWord(specialtyInput.trim());

      // Validate chuyên môn nhập lớn hơn 1 kí tự
      if (trimmedSpecialty.length <= 1) {
        message.error("Tên chuyên môn phải có độ dài lớn hơn 1 ký tự.");
        e.preventDefault();
        return;
      }
      // Validate chuyên môn không trùng nhau
      if (specialties.includes(trimmedSpecialty)) {
        message.error(
          "Tên chuyên môn của bạn đang trùng chuyên môn mà bạn vừa thêm."
        );
        e.preventDefault();
        return;
      }

      //Validate chuyên môn có trùng lĩnh vực vừa nhập không
      if (trimmedSpecialty === professionName) {
        message.error(
          "Tên chuyên môn của bạn đang trùng tên lĩnh vực mà bạn vừa nhập."
        );
        e.preventDefault();
        return;
      }

      //Validate chuyên môn trùng với chuyên môn trong data
      if (isNameDuplicate2) {
        message.error(
          "Tên chuyên môn đang trùng với lĩnh vực hoặc chuyên môn đã tồn tại khác."
        );
        e.preventDefault();
        return;
      }

      if (isOnlyNumber2 || isInvalidWhitespace2) {
        message.error("Hãy điền đúng điều kiện nhập trước khi Enter");
        e.preventDefault();
        return;
      }

      // Validate chuyên môn không chứa ký tự đặc biệt
      if (!REGEX.test(trimmedSpecialty)) {
        message.error("Tên chuyên môn không được chứa ký tự đặc biệt.");
        e.preventDefault();
        return;
      }

      setSpecialtiesData([...specialties, trimmedSpecialty]);
      setSpecialtyInput("");
      e.preventDefault();
    }
  };

  const handleRemoveSpecialty = (removedSpecialty) => {
    setSpecialtiesData(
      specialties.filter((specialty) => specialty !== removedSpecialty)
    );
  };

  //Hàm xử lý nhập lĩnh vực
  const handleProfessionNameChange = (e) => {
    let value = e.target.value.normalize("NFC");
    value = capitalizeEachWord(value);

    // Loại bỏ khoảng trắng đầu và cuối, nhưng giữ khoảng trắng giữa các từ
    if (value.length <= MAX_LENGTH) {
      setProfessionName(value);

      // Kiểm tra trùng tên chuyên môn hoặc lĩnh vực nào trong data
      checkDuplicateProfessionName(value);

      // Kiểm tra nếu giá trị chỉ là khoảng trắng hoặc có khoảng trắng liên tục
      if (value.length === 0) {
        setIsInvalidWhitespace(false);
        setIsOnlyNumber(false);
      } else if (/^\s*$/.test(value) || /\s{2,}/.test(value)) {
        setIsInvalidWhitespace(true);
      } else {
        setIsInvalidWhitespace(false);
      }

      // Check if the name contains only numbers
      if (/^[0-9\s]+$/.test(value)) {
        setIsOnlyNumber(true);
      } else {
        setIsOnlyNumber(false);
      }
    } else {
      message.warning(`Tên lĩnh vực không được dài quá ${MAX_LENGTH} ký tự.`);
    }
  };

  const handleProfessionNameKeyDown = (e) => {
    // Ngăn sự kiện nếu phím Enter được nhấn
    if (e.key === "Enter") {
      const trimmedProfessionName = capitalizeEachWord(professionName.trim());

      // Validate chuyên môn nhập lớn hơn 1 kí tự
      if (trimmedProfessionName.length <= 1) {
        message.error("Tên lĩnh vực phải có độ dài lớn hơn 1 ký tự.");
        e.preventDefault();
        return;
      }

      //Validate chuyên môn trùng với chuyên môn trong data
      if (isNameDuplicate) {
        message.error(
          "Tên lĩnh vực đang trùng với lĩnh vực hoặc chuyên môn đã tồn tại khác."
        );
        e.preventDefault();
        return;
      }

      if (isOnlyNumber || isInvalidWhitespace) {
        message.error("Hãy điền đúng điều kiện nhập trước khi Enter");
        e.preventDefault();
        return;
      }
      setProfessionName(trimmedProfessionName);
      e.preventDefault();
    }
  };

  //Pop-up xác nhận thêm vào hay không
  const handleConfirmSubmit = () => {
    setShowConfirmModal(true);
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  const checkDuplicateProfessionName = async (name) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/profession/search?name=${name}`
      );

      if (response.status === 200 || response.status === 201) {
        if (
          response.data.professions.length > 0 ||
          response.data.specialties.length > 0
        ) {
          setIsNameDuplicate(true);
        } else {
          setIsNameDuplicate(false);
        }
      } else if (response.status === 404) {
        setIsNameDuplicate(false);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setIsNameDuplicate(false);
      } else {
        console.error("Error checking profession name:", error);
      }
    }
  };

  const checkDuplicateSpecialtyName = async (name) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/profession/search?name=${name}`
      );
      console.log("dup name:" + name);
      console.log("dup name2:" + professionName);
      if (
        response.data.professions.length > 0 ||
        response.data.specialties.length > 0 ||
        name === professionName
      ) {
        setIsNameDuplicate2(true);
      } else {
        setIsNameDuplicate2(false);
      }

      if (response.status === 404) {
        console.log("Your specialty is not duplicate");
      }
    } catch (error) {
      console.error("Error checking profession name:", error);
    }
  };

  const modalHeader = (
    <>
      <h3 style={{ color: "#FFF", padding: "0px", margin: "0" }}>
        Thêm lĩnh vực và chuyên môn mới
      </h3>
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
                type="text"
                placeholder="VD: Công nghệ thông tin"
                value={professionName}
                onChange={handleProfessionNameChange}
                onKeyDown={handleProfessionNameKeyDown}
                style={{ marginBottom: "5px" }}
              />{" "}
              <small
                className="limitwords"
                style={{
                  display: professionName.length > 1 ? "none" : "block",
                }}
              >
                {/* <ExclamationCircleOutlined style={{ color: "red" }} /> */}
                <span style={{ color: "red" }}>*</span>
                &nbsp;Điền ít nhất 2 kí tự
              </small>
              <small
                className="limitwords"
                style={{
                  display: isInvalidWhitespace ? "block" : "none",
                }}
              >
                <CloseCircleOutlined style={{ color: "red" }} />
                &nbsp;Không được bắt đầu hoặc liên tục chứa khoảng trắng
              </small>
              <small
                className="limitwords"
                style={{
                  display: isOnlyNumber ? "block" : "none",
                }}
              >
                <CloseCircleOutlined style={{ color: "red" }} />
                &nbsp;Tên không được chỉ mỗi số
              </small>
              <small
                className="limitwords"
                style={{
                  display: professionName.length <= 1 ? "none" : "block",
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
                  display: professionName.length <= 1 ? "none" : "block",
                }}
              >
                {REGEX.test(professionName) ? (
                  <CheckCircleOutlined style={{ color: "green" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "red" }} />
                )}
                &nbsp;Không bao gồm kí tự đặc biệt
              </small>
              <small
                className="limitwords"
                style={{
                  display: professionName.length <= 1 ? "none" : "block",
                }}
              >
                {isNameDuplicate ? (
                  <CloseCircleOutlined style={{ color: "red" }} />
                ) : (
                  <CheckCircleOutlined style={{ color: "green" }} />
                )}
                &nbsp;Tên không trùng với lĩnh vực hoặc chuyên môn khác
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
                placeholder="VD: Lập trình Web"
                value={specialtyInput}
                onChange={handleSpecialtyInputChange}
                onKeyDown={handleSpecialtyKeyDown}
                style={{ marginBottom: "5px" }}
              />
              <small
                className="limitwords"
                style={{
                  display: specialtyInput.length > 1 ? "none" : "block",
                }}
              >
                {/* <ExclamationCircleOutlined style={{ color: "red" }} /> */}
                <span style={{ color: "red" }}>*</span>
                &nbsp;Điền ít nhất 2 kí tự
              </small>
              <small
                className="limitwords"
                style={{
                  display: isInvalidWhitespace2 ? "block" : "none",
                }}
              >
                <CloseCircleOutlined style={{ color: "red" }} />
                &nbsp;Không được bắt đầu hoặc liên tục chứa khoảng trắng
              </small>
              <small
                className="limitwords"
                style={{
                  display: isOnlyNumber2 ? "block" : "none",
                }}
              >
                <CloseCircleOutlined style={{ color: "red" }} />
                &nbsp;Tên không được chỉ mỗi số
              </small>
              <small
                className="limitwords"
                style={{
                  display: specialtyInput.length <= 1 ? "none" : "block",
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
                  display: specialtyInput.length <= 1 ? "none" : "block",
                }}
              >
                {REGEX.test(specialtyInput) ? (
                  <CheckCircleOutlined style={{ color: "green" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "red" }} />
                )}
                &nbsp;Không bao gồm kí tự đặc biệt
              </small>
              <small
                className="limitwords"
                style={{
                  display: specialtyInput.length <= 1 ? "none" : "block",
                }}
              >
                {isNameDuplicate2 || specialtyInput === professionName ? (
                  <CloseCircleOutlined style={{ color: "red" }} />
                ) : (
                  <CheckCircleOutlined style={{ color: "green" }} />
                )}
                &nbsp;Tên không trùng với lĩnh vực hoặc chuyên môn khác
              </small>
              <small className="hint_addspecialty">
                (*) Nếu thêm 1 chuyên môn mới hãy nhấn{" "}
                <span className="key_enter">
                  <EnterOutlined /> Enter
                </span>{" "}
                để lưu khi nhập xong
              </small>
            </Form.Group>
            <Form.Group style={{ marginBottom: "10px" }}>
              <div
                className="speicalty_tag_container"
                style={{ display: "flex" }}
              >
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
                    onClose={() => handleRemoveSpecialty(specialty)}
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
            Cho hoạt động{" "}
            {isActive ? (
              <UnlockOutlined
                style={{
                  color: "green",
                }}
              />
            ) : (
              <LockOutlined
                style={{
                  color: "red",
                }}
              />
            )}
          </Checkbox>
        </Col>
      </Row>
    </Container>
  );

  //Footer button
  const modalFooter = (
    <>
      <ConfirmButton
        content="Thêm Vào"
        onClick={handleConfirmSubmit}
        disabled={!isFormValid}
      />
      <CancelButton  content="Thoát" onClick={handleClose}/>
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
        show={showExitConfirmModal}
        title="Xác nhận thoát"
        content="Nếu bạn thoát hệ thống sẽ không lưu những gì bạn đã nhập đâu!"
        onConfirm={() => {
          setShowExitConfirmModal(false);
          resetFormAndClose();
        }}
        onCancel={() => setShowExitConfirmModal(false)}
      />
    </>
  );
};

export default AddNewProfession;
