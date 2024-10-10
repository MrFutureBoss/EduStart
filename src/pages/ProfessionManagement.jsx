import axios from "axios";
import { BASE_URL } from "../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import { setProfessions } from "../redux/slice/ProfessionSlice.js";
import { setSpecialties } from "../redux/slice/SpecialtySlice.js";
import { useEffect, useState } from "react";
import { Card, Button, Col, Container, Row } from "react-bootstrap";
import {
  EditOutlined,
  LockOutlined,
  PlusCircleOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { Pagination, Tag } from "antd";
import AddNewProfession from "./AddNewProfession.jsx";

const ProfessionManagement = () => {
  const dispatch = useDispatch();
  const professions = useSelector((state) => state.profession.professions.data);
  const specialties = useSelector(
    (state) => state.specialty.specialties.data || []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  //Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10); // Define page size state

  useEffect(() => {
    console.log(`Fetching data for page: ${currentPage}, limit: ${pageSize}`);
    axios
      .get(`${BASE_URL}/profession`, {
        params: {
          page: currentPage,
          limit: pageSize,
        },
      })
      .then((res) => {
        setTotalItems(res.data.total);
        dispatch(setProfessions(res.data));
      })
      .catch((err) => console.log("Error fetching professions", err));
  }, [dispatch, currentPage, pageSize]); // This ensures the fetch happens when currentPage or pageSize changes

  //Gọi data specialty
  useEffect(() => {
    axios
      .get(`${BASE_URL}/specialty`)
      .then((res) => {
        console.log("Total Specialties: " + res.data.total);
        dispatch(setSpecialties(res.data));
      })
      .catch((err) => console.log("Error fetching specialties", err));
  }, [dispatch]);

  const getSpecialtyNameById = (id) => {
    const define = specialties.find((sp) => sp._id === id);
    return define ? define.name : "Unknown";
  };

  //Đổi status lĩnh vực
  const toggleStatus = (id, currentStatus) => {
    const updatedStatus = { status: !currentStatus };

    axios
      .patch(`${BASE_URL}/profession/${id}`, updatedStatus)
      .then((res) => {
        dispatch(
          setProfessions({
            ...professions,
            data: professions.map((pro) =>
              pro._id === id ? { ...pro, status: !currentStatus } : pro
            ),
          })
        );
      })
      .catch((err) => console.log("Error updating profession status", err));
  };

  const onPageChange = (pageNumber) => {
    console.log(`Changing to page: ${pageNumber}`); // Debugging
    setCurrentPage(pageNumber); // This updates the current page
  };

  const onPageSizeChange = (current, size) => {
    setPageSize(size);
    setCurrentPage(1);
    axios
      .get(`${BASE_URL}/profession`, {
        params: {
          page: 1,
          limit: size,
        },
      })
      .then((res) => {
        setTotalItems(res.data.total);
        dispatch(setProfessions(res.data));
      })
      .catch((err) => console.log("Error fetching professions", err));
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Container fluid>
      <AddNewProfession show={isModalOpen} close={handleCloseModal} />
      <Row>
        <h1>Quản lý lĩnh vực và chuyên môn</h1>
      </Row>
      <Row style={{ marginBottom: "10px" }}>
        <Button
          style={{ width: "10rem" }}
          variant="primary"
          onClick={handleOpenModal}
        >
          <PlusCircleOutlined /> Thêm lĩnh vực
        </Button>
      </Row>
      <Row>
        {professions.map((pro) => (
          <Col sm={6} key={pro._id} style={{ margin: "auto" }}>
            <Card style={{ width: "100%", marginBottom: "5px" }}>
              {/* <Card.Img variant="top" src="holder.js/100px180" /> */}
              <Card.Body>
                <Row>
                  <Col sm={9}>
                    <Card.Title>{pro.name}</Card.Title>
                  </Col>
                  <Col
                    sm={3}
                    style={{
                      margin: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "end",
                      gap: "4px",
                    }}
                  >
                    {pro.status ? (
                      <UnlockOutlined
                        style={{
                          color: "green",
                          fontSize: "34px",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleStatus(pro._id, pro.status)}
                      />
                    ) : (
                      <LockOutlined
                        style={{
                          color: "red",
                          fontSize: "34px",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleStatus(pro._id, pro.status)}
                      />
                    )}
                    <Button
                      style={{ borderWidth: "2px" }}
                      Button
                      variant="outline-primary"
                    >
                      <EditOutlined twoToneColor="#FFF" />
                    </Button>
                  </Col>
                </Row>
                <Card.Text>
                  Chuyên môn:
                  {pro.specialty.length > 0 ? (
                    pro.specialty.map((sp) => (
                      <Tag key={sp}>{getSpecialtyNameById(sp)}</Tag>
                    ))
                  ) : (
                    <span>Chưa có chuyên môn nào </span>
                  )}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <Row>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalItems} // Total number of items (e.g., 500)
          onChange={onPageChange} // Trigger onPageChange when a new page is clicked
        />
      </Row>
    </Container>
  );
};

export default ProfessionManagement;
