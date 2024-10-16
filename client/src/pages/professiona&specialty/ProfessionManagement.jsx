import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import {
  setProfessions,
  setSpecialtiesData,
} from "../../redux/slice/ProfessionSlice.js";
import { setSpecialties } from "../../redux/slice/SpecialtySlice.js";
import { useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import {
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  LockOutlined,
  PlusCircleOutlined,
  UnlockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Card,
  Empty,
  Pagination,
  Popconfirm,
  Popover,
  Tag,
} from "antd";
import AddNewProfession from "./AddNewProfession.jsx";
import EditProfession from "./EditProfession.jsx";
import "../../style/Admin/Profession.css";
import Search from "antd/es/transfer/search.js";

const ProfessionManagement = () => {
  const dispatch = useDispatch();
  const professions = useSelector((state) => state.profession.professions.data);
  const specialtiesData = useSelector(
    (state) => state.profession.specialtiesData.data || []
  );
  const specialties = useSelector(
    (state) => state.specialty.specialties.data || []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [professionId, setProfessionId] = useState("");
  //Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(6);

  console.log("sp from pf redux:" + specialtiesData);
  console.log("sp from redux:" + specialties);
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
  }, [dispatch, currentPage, pageSize]);

  //Gọi data specialty
  useEffect(() => {
    axios
      .get(`${BASE_URL}/specialty`)
      .then((res) => {
        console.log("Total Specialties: " + res.data.total);

        dispatch(setSpecialties(res.data));
        
        dispatch(setSpecialtiesData(specialties));
      })
      .catch((err) => console.log("Error fetching specialties", err));
  }, [dispatch]);

  const getSpecialtyNameById = (id) => {
    const define = specialties.find((sp) => sp._id === id);
    return define ? define.name : "Unknown";
  };

  const getSpecialtyStatusById = (id) => {
    const define = specialties.find((sp) => sp._id === id);
    return define ? define.status : false;
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

  const cancelToggle = (e) => {
    console.log(e);
  };

  const onPageChange = (pageNumber) => {
    console.log(`Changing to page: ${pageNumber}`);
    setCurrentPage(pageNumber);
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

  const handleOpenEditModal = (id) => {
    setProfessionId(id);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setProfessionId("");
    setIsEditModalOpen(false);
  };
  return (
    <Container fluid>
      <AddNewProfession show={isModalOpen} close={handleCloseModal} />
      <EditProfession
        _id={professionId}
        show={isEditModalOpen}
        close={handleCloseEditModal}
      />
      <Row style={{ marginBottom: "10px" }}>
        <Col sm={2}>
          <Button
            style={{ width: "10rem" }}
            variant="primary"
            onClick={handleOpenModal}
          >
            <PlusCircleOutlined /> Thêm lĩnh vực
          </Button>
        </Col>
        <Col sm={5}>
          <Search
            placeholder="Tìm theo tên lĩnh vực và chuyên môn"
            // onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "260px", marginBottom: "20px" }}
            allowClear
          />
        </Col>
      </Row>
      <Row>
        {professions.length > 0 ? (
          professions.map((pro) => (
            <Col
              sx={12}
              sm={12}
              md={12}
              lg={6}
              key={pro._id}
              className="profession-list"
            >
              <Badge.Ribbon
                text={
                  <span className="count-mentors">
                    0&nbsp;
                    <EyeOutlined
                      style={{
                        fontSize: "inherit",
                        lineHeight: 1,
                        verticalAlign: "middle",
                      }}
                    />
                  </span>
                }
              >
                <Card
                  actions={[
                    pro.status ? (
                      <Popover content="Đang hoạt động">
                        <Popconfirm
                          title="Đổi trạng thái hoạt động"
                          description="Bạn có chắc là muốn cho dừng hoạt động lĩnh vực này không?"
                          onConfirm={() => toggleStatus(pro._id, pro.status)}
                          onCancel={cancelToggle}
                          okText="Có"
                          cancelText="Hủy"
                        >
                          <UnlockOutlined
                            style={{
                              color: "green",
                              fontSize: "18px",
                              cursor: "pointer",
                            }}
                          />
                        </Popconfirm>
                      </Popover>
                    ) : (
                      <Popover content="Chưa hoạt động">
                        <Popconfirm
                          title="Đổi trạng thái hoạt động"
                          description="Bạn có chắc là muốn cho hoạt động lĩnh vực này không?"
                          onConfirm={() => toggleStatus(pro._id, pro.status)}
                          onCancel={cancelToggle}
                          okText="Có"
                          cancelText="Hủy"
                        >
                          <LockOutlined
                            style={{
                              color: "red",
                              fontSize: "18px",
                              cursor: "pointer",
                            }}
                          />
                        </Popconfirm>
                      </Popover>
                    ),
                    <Popover content="Cập nhật">
                      <EditOutlined
                        style={{
                          fontSize: "18px",
                          cursor: "pointer",
                        }}
                        key="edit"
                        onClick={() => handleOpenEditModal(pro._id)}
                      />
                    </Popover>,
                    <EllipsisOutlined key="ellipsis" />,
                  ]}
                  style={{
                    width: "28rem",
                    height: "100%",
                    marginBottom: "5px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Card.Meta
                    avatar={
                      <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" />
                    }
                    title={pro.name}
                    description={
                      <div>
                        Chuyên môn: &nbsp;
                        {pro.specialty.length > 0 ? (
                          pro.specialty.map((sp) => (
                            <Popover content="Đang hoạt động">
                              <Tag
                                bordered={true}
                                className="specialty-tags"
                                key={sp}
                              >
                                <span
                                  style={{
                                    marginRight: "6px",
                                  }}
                                >
                                  {getSpecialtyNameById(sp)}&nbsp;
                                </span>
                                <span
                                  className="count-mentors"
                                  style={{ borderLeft: "1px solid white" }}
                                >
                                  0
                                  <UserOutlined
                                    style={{
                                      fontSize: "inherit",
                                      lineHeight: 1,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                </span>
                                {/* <span className="specialty-status">
                                {getSpecialtyStatusById(sp) ? (
                                  <UnlockFilled />
                                ) : (
                                  <LockFilled />
                                )}
                              </span> */}
                              </Tag>
                            </Popover>
                          ))
                        ) : (
                          <Tag className="specialty-tags">
                            Chưa có chuyên môn nào{" "}
                          </Tag>
                        )}
                      </div>
                    }
                  />
                </Card>
              </Badge.Ribbon>
            </Col>
          ))
        ) : (
          <Empty />
        )}
      </Row>
      <Row>
        <Pagination
          showQuickJumper
          style={{
            display: "flex",
            justifyContent: "center",
          }}
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={onPageChange}
        />
      </Row>
    </Container>
  );
};

export default ProfessionManagement;
