import axios from "axios";
import { BASE_URL } from "../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import { setProfessions } from "../redux/slice/ProfessionSlice.js";
import { useEffect, useState } from "react";
import { Card, Button, Col, Container, Row} from "react-bootstrap";
import {
  EditOutlined,
  LockOutlined,
  PlusCircleOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import  {Pagination} from "antd"
import DefaultNavbar from "../components/Navbar/index.js";

const ProfessionManagement = () => {
  const dispatch = useDispatch();
  const professions = useSelector((state) => state.profession.professions.data);
  const total = useSelector((state) => state.profession.professions.total);
  const [status, setStatus] = useState(false);
  // Call profession data
  useEffect(() => {
    axios
      .get(`${BASE_URL}/profession`)
      .then((res) => {
        console.log("Total: " + res.data.total);
        dispatch(setProfessions(res.data)); // Pass the entire response to the reducer
      })
      .catch((err) => console.log("Error fetching professions", err));
  }, [dispatch]);

  const toggleStatus = (id, currentStatus) => {
    // Create the new status object
    const updatedStatus = { status: !currentStatus };

    axios
      .patch(`${BASE_URL}/profession/${id}`, updatedStatus)
      .then((res) => {
        // Update the local state after a successful request
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

  const onChange = (pageNumber) => {
    console.log('Page: ', pageNumber);
  };
  
  return (
    <Container fluid>
      <DefaultNavbar/>
      <Row>
        <h1>Profession & Specialty Management</h1>
      </Row>
      <Row style={{ marginBottom: "10px" }}>
        <Button style={{ width: "10rem" }} variant="primary">
          <PlusCircleOutlined /> Thêm lĩnh vực
        </Button>
      </Row>
      <Row>
        {professions.map((pro) => (
          <Col sm={6} key={pro._id} style={{ margin: "auto" }}>
            <Card style={{ width: "100%", marginBottom: "5px" }}>
              <Card.Img variant="top" src="holder.js/100px180" />
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
                      <LockOutlined
                        style={{
                          color: "red",
                          fontSize: "34px",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleStatus(pro._id, pro.status)}
                      />
                    ) : (
                      <UnlockOutlined
                        style={{
                          color: "green",
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
                <Card.Text>Chuyên môn:</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <Row>
      <Pagination showQuickJumper defaultCurrent={2} total={500} onChange={onChange} />
      </Row>
    </Container>
  );
};

export default ProfessionManagement;
