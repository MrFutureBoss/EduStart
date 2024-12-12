import { useEffect, useState } from "react";
import CustomModal from "../../components/Modal/LargeModal.jsx";
import ConfirmModal from "../../components/Modal/ConfirmModal.jsx";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { Popconfirm, Switch, Tag, message } from "antd";
import "../../style/Admin/Profession.css";
import {
  CloseCircleOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  EnterOutlined,
  DeleteOutlined,
  PlusOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import { setProfessions } from "../../redux/slice/ProfessionSlice.js";
const EditProfession = ({ _id, show, close }) => {
  const dispatch = useDispatch();
  const professions = useSelector((state) => state.profession.professions.data);
  const [isFormValid, setIsFormValid] = useState(false);
  const [specialties, setSpecialtiesData] = useState([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [professionData, setProfessionData] = useState({
    name: "",
    specialties: [],
    status: false,
  });
  const [professionName, setProfessionName] = useState(professionData.name);
  const [isActive, setIsActive] = useState(false);
  const [isNameDuplicate, setIsNameDuplicate] = useState(false);
  const [isInvalidWhitespace, setIsInvalidWhitespace] = useState(false);
  const [isOnlyNumber, setIsOnlyNumber] = useState(false);
  const [isNameDuplicate2, setIsNameDuplicate2] = useState(false);
  const [isInvalidWhitespace2, setIsInvalidWhitespace2] = useState(false);
  const [isOnlyNumber2, setIsOnlyNumber2] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showAddSpecialtyInput, setShowAddSpecialtyInput] = useState(false);
  const [showEditSpecialtyInput, setShowEditSpecialtyInput] = useState(false);
  const [showAddPopconfirm, setShowAddPopconfirm] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState(null);
  const [editSpecialtyInput, setEditSpecialtyInput] = useState("");
  const [closedSpecialties, setClosedSpecialties] = useState([]);

  const MAX_LENGTH = 30;
  const REGEX =
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơưẠ-ỹ0-9\s-]+$/u;

  // Hàm lấy dữ liệu profession theo ID
  const getProfessionById = async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/profession/${id}`);
      const fetchedData = response.data;
      setProfessionData({
        name: fetchedData.name || "",
        specialties: fetchedData.specialties || [],
        status: fetchedData.status || false,
      });
      setProfessionName(fetchedData.name || "");
    } catch (err) {
      message.error("Có lỗi xảy ra khi lấy dữ liệu lĩnh vực.");
    }
  };

  const getSpecialtiesByProfessionId = async (id) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/profession/${id}/specialties`
      );
      const fetchedData = response.data;
      setSpecialtiesData(fetchedData.data || []); // Đảm bảo rằng specialties là một mảng hoặc mặc định là []
    } catch (err) {
      message.error("Có lỗi xảy ra khi lấy dữ liệu chuyên môn.");
      setSpecialtiesData([]);
    }
  };

  useEffect(() => {
    if (_id) {
      getProfessionById(_id);
      getSpecialtiesByProfessionId(_id);
    }
  }, [_id]);

  useEffect(() => {
    if (professionData.status !== undefined) {
      setIsActive(professionData.status);
    }
  }, [professionData.status]);

  //Check điều kiện để được submit thêm vào
  useEffect(() => {
    const isProfessionValid =
      professionName.length > 1 &&
      professionName.length <= MAX_LENGTH &&
      !isInvalidWhitespace &&
      REGEX.test(professionName) &&
      !isNameDuplicate &&
      !isOnlyNumber;

    // const isSpecialtyValid =
    //   // specialtyInput.length === 0 ||
    //   // (specialtyInput.length > 1 &&
    //   //   specialtyInput.length <= MAX_LENGTH &&
    //   REGEX.test(specialtyInput) &&
    //   !isNameDuplicate2 &&
    //   !isInvalidWhitespace2 &&
    //   !isOnlyNumber2;

    setIsFormValid(isProfessionValid);
  }, [
    professionName,
    isInvalidWhitespace,
    isNameDuplicate,
    // specialtyInput,
    // isNameDuplicate2,
    // // specialties,
    // isInvalidWhitespace2,
    // isOnlyNumber2,
  ]);

  const handleSubmit = async () => {
    // Validate dữ liệu trước khi gửi
    if (professionName.length < 2 || professionName.length > MAX_LENGTH) {
      message.warning(`Tên lĩnh vực phải từ 2 đến ${MAX_LENGTH} ký tự.`);
      return;
    }

    if (!REGEX.test(professionName)) {
      message.error("Tên lĩnh vực không được chứa số hoặc ký tự đặc biệt.");
      return;
    }

    const filteredSpecialties = specialties.filter(
      (specialty) => !specialty.isDeleted
    );

    // Chuẩn bị dữ liệu để gửi lên API
    const data = {
      name: professionName,
      status: isActive,
      specialties: filteredSpecialties.map((sp) => ({
        _id: sp._id || undefined,
        name: sp.name,
        status: sp.status || isActive,
      })),
    };

    try {
      const response = await axios.put(
        `${BASE_URL}/profession/${_id}/specialties`,
        data
      );
      if (response.status === 200 || response.status === 201) {
        message.success("Cập nhật lĩnh vực và chuyên môn thành công.");
        const updatedProfession = await axios.get(
          `${BASE_URL}/profession`
        );

        dispatch(setProfessions(updatedProfession.data));

        // Reset form sau khi cập nhật thành công
        setProfessionName("");
        setSpecialtiesData([]);
        setIsActive(false);
        setShowConfirmModal(false);
        close();
      }
    } catch (error) {
      // Kiểm tra và hiển thị lỗi từ backend
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        message.error(error.response.data.message); // Hiển thị lỗi từ backend (VD: "Lĩnh vực đã tồn tại")
      } else {
        message.error("Có lỗi xảy ra khi cập nhật lĩnh vực và chuyên môn.");
      }
      console.error("Error updating profession and specialties:", error);
    }
  };

  const resetFormAndClose = () => {
    // Reset các trạng thái của form về mặc định
    setProfessionName("");
    setSpecialtiesData([]);
    setIsActive(false);
    setIsNameDuplicate(false);
    setIsInvalidWhitespace(false);
    setIsOnlyNumber(false);
    setIsNameDuplicate2(false);
    setIsInvalidWhitespace2(false);
    setIsOnlyNumber2(false);
    setSpecialtyInput("");
    setEditSpecialtyInput("");
    setEditingSpecialty(null);
    setClosedSpecialties([]);
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
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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

      setSpecialtiesData([
        ...specialties,
        { name: trimmedSpecialty, status: true },
      ]);
      setSpecialtyInput("");
      e.preventDefault();
    }
  };

  // Hàm xử lý khi nhấn "close"
  const handleRemoveSpecialty = (removedSpecialty) => {
    // Đánh dấu chuyên môn là đã bị xóa thay vì xóa hẳn
    const updatedSpecialties = specialties.map((specialty) =>
      specialty.name === removedSpecialty.name
        ? { ...specialty, isDeleted: true } // Đánh dấu isDeleted là true
        : specialty
    );

    setSpecialtiesData(updatedSpecialties);
  };

  const handleUndoRemoveSpecialty = (restoredSpecialty) => {
    // Phục hồi chuyên môn đã bị xóa
    const updatedSpecialties = specialties.map((specialty) =>
      specialty.name === restoredSpecialty.name
        ? { ...specialty, isDeleted: false } // Đánh dấu isDeleted là false
        : specialty
    );

    setSpecialtiesData(updatedSpecialties);
  };

  // Hàm xử lý khi nhấn "Hoàn tác"
  // const handleUndoRemoveSpecialty = (restoredSpecialty) => {
  //   setClosedSpecialties(
  //     closedSpecialties.filter(
  //       (specialtyId) =>
  //         specialtyId !== restoredSpecialty._id &&
  //         specialtyId !== restoredSpecialty.name
  //     )
  //   );
  // };

  //Hàm xử lý nhập lĩnh vực
  const handleProfessionNameChange = (e) => {
    let { name, value } = e.target;
    value = value.normalize("NFC");
    value = capitalizeEachWord(value);
    // Chỉ chặn khoảng trắng ở đầu hoặc chuỗi chỉ chứa khoảng trắng
    if (value.trim().length === 0 && value.length > 0) {
      // Nếu chuỗi chỉ chứa khoảng trắng hoặc bắt đầu bằng khoảng trắng
      setIsInvalidWhitespace(true);
    } else {
      setIsInvalidWhitespace(false);
    }

    // Kiểm tra nếu chuỗi chỉ chứa số
    if (/^[0-9\s]+$/.test(value)) {
      setIsOnlyNumber(true);
    } else {
      setIsOnlyNumber(false);
    }

    // Cập nhật giá trị cho professionData và professionName
    setProfessionData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setProfessionName(value);

    // Reset trạng thái kiểm tra trùng tên
    setIsNameDuplicate(false);

    // Gọi API để kiểm tra tên trùng nếu có ít nhất 2 ký tự
    if (value.length > 1) {
      checkDuplicateProfessionName(value);
    }
  };

  const handleProfessionNameKeyDown = (e) => {
    const value = e.target.value;

    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }
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

  const handleAddSpecialty = () => {
    setShowAddSpecialtyInput(true);
    setShowEditSpecialtyInput(false);
    setSpecialtyInput("");
    setIsInvalidWhitespace2(false);
    setIsOnlyNumber2(false);
    setIsNameDuplicate2(false);
  };

  const handleEditSpecialty = (specialty) => {
    setShowEditSpecialtyInput(true);
    setShowAddSpecialtyInput(false);
    setEditingSpecialty(specialty); // Lưu chuyên môn hiện tại đang chỉnh sửa
    setEditSpecialtyInput(specialty.name); // Đặt tên chuyên môn vào input để chỉnh sửa
  };

  const handleEditSpecialtyInputChange = (e) => {
    let { value } = e.target;
    value = capitalizeEachWord(value.normalize("NFC"));

    // Validate giới hạn ký tự
    if (value.length <= MAX_LENGTH) {
      setEditSpecialtyInput(value);

      // Validate có trùng tên chuyên môn hoặc lĩnh vực nào không
      checkDuplicateSpecialtyName(value);

      // Validate có spam khoảng trắng không
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

  // Hàm xử lý khi chỉnh sửa chuyên môn
  const handleEditSpecialtyKeyDown = (e) => {
    if (e.key === "Enter") {
      const trimmedSpecialty = capitalizeEachWord(editSpecialtyInput.trim());

      // Validate chuyên môn nhập lớn hơn 1 kí tự
      if (trimmedSpecialty.length <= 1) {
        message.error("Tên chuyên môn phải có độ dài lớn hơn 1 ký tự.");
        e.preventDefault();
        return;
      }

      if (specialties.includes(trimmedSpecialty)) {
        message.error(
          "Tên chuyên môn của bạn đang trùng chuyên môn mà bạn vừa thêm."
        );
        e.preventDefault();
        return;
      }

      // Cập nhật chuyên môn nếu hợp lệ
      const updatedSpecialties = specialties.map((specialty) => {
        if (specialty._id === editingSpecialty._id) {
          return { ...specialty, name: trimmedSpecialty }; // Cập nhật tên chuyên môn
        }
        return specialty;
      });

      setSpecialtiesData(updatedSpecialties);
      setEditingSpecialty(null);
      setEditSpecialtyInput("");
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
      <h3 style={{ color: "#FFF" }}>Cập nhật lĩnh vực và chuyên môn</h3>
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
              type="text"
              placeholder="Trí tuệ nhân tạo"
            >
              <Form.Label style={{ fontWeight: "600" }}>
                Tên lĩnh vực:
              </Form.Label>
              <Form.Control
                style={{ marginBottom: "5px" }}
                type="text"
                placeholder="VD: Công nghệ thông tin"
                value={professionName}
                name="name"
                onChange={handleProfessionNameChange}
                onKeyDown={handleProfessionNameKeyDown}
              />{" "}
              <small
                className="limitwords"
                style={{
                  display:
                    professionData.name.length > 1 ? "none" : "block",
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
            {showAddSpecialtyInput ? (
              <Form.Group
                style={{ marginBottom: "10px" }}
                controlId="formSpecializationName"
              >
                <Form.Label style={{ fontWeight: "600" }}>
                  Tên chuyên môn:
                </Form.Label>
                <Row>
                  <Col sm={9}>
                    <Form.Control
                      type="text"
                      placeholder="VD: Lập trình Web"
                      value={specialtyInput}
                      onChange={handleSpecialtyInputChange}
                      onKeyDown={handleSpecialtyKeyDown}
                      style={{ marginBottom: "5px" }}
                    />
                  </Col>
                  <Col sm={3} style={{ display: "flex", alignItems: "center" }}>
                    <Popconfirm
                      title="Bạn có chắc chắn muốn đóng không?"
                      description="Nếu đóng sẽ mất tất cả dữ liệu thêm vào"
                      onConfirm={() => setShowAddSpecialtyInput(false)}
                      onCancel={() => setShowAddPopconfirm(false)}
                      okText="Có"
                      cancelText="Không"
                    >
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (specialtyInput.length > 0) {
                            setShowAddPopconfirm(true);
                          } else {
                            setSpecialtyInput("");
                            setIsInvalidWhitespace2(false);
                            setIsOnlyNumber2(false);
                            setIsNameDuplicate2(false);
                            setShowAddSpecialtyInput(false);
                          }
                        }}
                      >
                        Đóng
                      </Button>
                    </Popconfirm>
                  </Col>
                </Row>
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
            ) : (
              <></>
            )}
            {showEditSpecialtyInput ? (
              <Form.Group
                style={{ marginBottom: "10px" }}
                controlId="formEditSpecializationName"
              >
                <Form.Label style={{ fontWeight: "600" }}>
                  Chỉnh sửa chuyên môn:
                </Form.Label>
                <Row>
                  <Col sm={9}>
                    <Form.Control
                      type="text"
                      placeholder="VD: Lập trình Web"
                      value={editSpecialtyInput}
                      onChange={handleEditSpecialtyInputChange}
                      onKeyDown={handleEditSpecialtyKeyDown}
                      style={{ marginBottom: "5px" }}
                    />
                  </Col>
                  <Col sm={3} style={{ display: "flex", alignItems: "center" }}>
                    <Button
                      variant="danger"
                      onClick={() => setShowEditSpecialtyInput(false)}
                    >
                      Đóng
                    </Button>
                  </Col>
                </Row>

                {/* Kiểm tra và hiển thị các lỗi tương tự như phần thêm */}
                <small
                  className="limitwords"
                  style={{
                    display: editSpecialtyInput.length > 1 ? "none" : "block",
                  }}
                >
                  <span style={{ color: "red" }}>*</span>
                  &nbsp;Điền ít nhất 2 kí tự
                </small>
                <small
                  className="limitwords"
                  style={{ display: isInvalidWhitespace2 ? "block" : "none" }}
                >
                  <CloseCircleOutlined style={{ color: "red" }} />
                  &nbsp;Không được bắt đầu hoặc liên tục chứa khoảng trắng
                </small>
                <small
                  className="limitwords"
                  style={{ display: isOnlyNumber2 ? "block" : "none" }}
                >
                  <CloseCircleOutlined style={{ color: "red" }} />
                  &nbsp;Tên không được chỉ mỗi số
                </small>
                <small
                  className="limitwords"
                  style={{
                    display: editSpecialtyInput.length <= 1 ? "none" : "block",
                  }}
                >
                  {editSpecialtyInput.length > 1 &&
                  editSpecialtyInput.length <= MAX_LENGTH ? (
                    <CheckCircleOutlined style={{ color: "green" }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: "red" }} />
                  )}
                  &nbsp;Giới hạn kí tự nhập:
                  <span
                    style={{
                      color:
                        editSpecialtyInput.length >= MAX_LENGTH
                          ? "red"
                          : "green",
                    }}
                  >
                    {editSpecialtyInput.length}
                  </span>
                  /{MAX_LENGTH} ký tự
                </small>
                <small
                  className="limitwords"
                  style={{
                    display:
                      isNameDuplicate2 || editSpecialtyInput === professionName
                        ? "block"
                        : "none",
                  }}
                >
                  <CloseCircleOutlined style={{ color: "red" }} />
                  &nbsp;Tên không trùng với lĩnh vực hoặc chuyên môn khác
                </small>
                <small className="hint_addspecialty">
                  (*) Nếu chỉnh sửa chuyên môn hãy nhấn{" "}
                  <span className="key_enter">
                    <EnterOutlined /> Enter
                  </span>{" "}
                  để lưu thay đổi
                </small>
              </Form.Group>
            ) : (
              <></>
            )}
            <Form.Group style={{ marginBottom: "10px" }}>
              <div
                className="speicalty_tag_container"
                style={{ display: "flex", flexWrap: "wrap" }}
              >
                <Tag
                  className="speicalty_edit-addtag"
                  style={{ display: showAddSpecialtyInput ? "none" : "block" }}
                  onClick={() => handleAddSpecialty()}
                >
                  <PlusOutlined /> Thêm
                </Tag>
                {specialties.length > 0 ? (
                  specialties.map((specialty, index) => (
                    <Tag
                      className="speicalty_edittag"
                      key={index}
                      style={{
                        backgroundColor: specialty.isDeleted ? "#d9d9d9" : "", // Đổi màu sang xám khi bị xóa
                        color: specialty.isDeleted ? "#8c8c8c" : "#fff", // Đổi màu chữ khi bị xóa
                        cursor: specialty.isDeleted ? "not-allowed" : "pointer", // Vô hiệu hóa con trỏ khi bị xóa
                      }}
                      closeIcon={
                        specialty.isDeleted ? (
                          <UndoOutlined
                            style={{
                              fontSize: "15px",
                              color: "#fff",
                              cursor: "pointer",
                            }}
                          />
                        ) : (
                          <CloseCircleOutlined
                            style={{
                              fontSize: "15px",
                              color: "#fff",
                              cursor: "pointer",
                            }}
                          />
                        )
                      }
                      closable
                      onClose={
                        () =>
                          specialty.isDeleted
                            ? handleUndoRemoveSpecialty(specialty) // Gọi hàm Undo khi đã bị xóa
                            : handleRemoveSpecialty(specialty) // Gọi hàm xóa khi chưa bị xóa
                      }
                      onClick={() =>
                        !specialty.isDeleted && handleEditSpecialty(specialty)
                      } // Chỉ cho phép chỉnh sửa khi chưa bị xóa
                    >
                      {specialty.name}
                    </Tag>
                  ))
                ) : (
                  <></>
                )}
              </div>
            </Form.Group>
          </Form>
          <Switch
            checkedChildren={
              <span>
                <UnlockOutlined /> Hoạt động
              </span>
            }
            unCheckedChildren={
              <span style={{ color: "#FFF" }}>
                <LockOutlined /> Dừng hoạt động
              </span>
            }
            checked={isActive}
            onChange={(checked) => setIsActive(checked)}
          />
        </Col>
      </Row>
    </Container>
  );

  //Footer button
  const modalFooter = (
    <>
      <Button
        variant="success"
        onClick={handleConfirmSubmit}
        disabled={!isFormValid}
      >
        Cập nhật
      </Button>
      <Button variant="danger" onClick={() => setShowDeleteConfirmModal(true)}>
        <DeleteOutlined style={{ color: "#FFF" }} /> Xóa tất cả
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
        title="Xác nhận thay đổi"
        content="Bạn có chắc chắn muốn thay đổi này không?"
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

export default EditProfession;
