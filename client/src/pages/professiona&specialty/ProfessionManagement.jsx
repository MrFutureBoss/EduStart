import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import {
  setProfessions,
  setSpecialtiesData,
  setSearchResults, // Add this action to store search results
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
  Select,
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
  const searchResults = useSelector(
    (state) => state.profession.searchResults || []
  ); // Search results from Redux
  const specialties = useSelector(
    (state) => state.specialty.specialties.data || []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [professionId, setProfessionId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [searchText, setSearchText] = useState(""); // Add state for search text
  const [visibleSpecialties, setVisibleSpecialties] = useState({});

  // Fetch initial professions and specialties on load
  useEffect(() => {
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

  // Fetch specialties
  useEffect(() => {
    axios
      .get(`${BASE_URL}/specialty`)
      .then((res) => {
        dispatch(setSpecialties(res.data));
        dispatch(setSpecialtiesData(specialties));
      })
      .catch((err) => console.log("Error fetching specialties", err));
  }, [dispatch]);

  const handleSearch = (value) => {
    setSearchText(value);

    if (value.length < 2) {
      // Reset professions if search input is too short
      axios
        .get(`${BASE_URL}/profession`, {
          params: { page: currentPage, limit: pageSize },
        })
        .then((res) => {
          setTotalItems(res.data.total);
          dispatch(setProfessions(res.data));
        })
        .catch((err) => console.log("Error fetching professions", err));
    } else {
      // Fetch search results based on user input for both professions and specialties
      axios
        .get(`${BASE_URL}/profession/search/like`, {
          params: { name: value, specialty: value }, // Search by both profession and specialty
        })
        .then((res) => {
          // Dispatch results for professions and specialties
          dispatch(setSearchResults(res.data.professions)); // Update searchResults in Redux
          dispatch(setSpecialties(res.data.specialties)); // Optional, if specialties need to be updated
        })
        .catch((err) => console.log("Error fetching search results", err));
    }
  };

  // Handle select option
  const handleSearchSelect = (value) => {
    const selectedProfession = professions.find((pro) => pro._id === value);
    if (selectedProfession) {
      // Perform logic when a profession is selected (e.g., showing details or updating state)
      console.log("Selected Profession:", selectedProfession);
    }
  };

  const getSpecialtyNameById = (id) => {
    const define = specialties.find((sp) => sp._id === id);
    return define ? define.name : "Unknown";
  };

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

  const displayProfessions =
    searchText.length > 1 && searchResults.length > 0
      ? searchResults
      : professions;

  const showMoreSpecialties = (id, totalSpecialties) => {
    setVisibleSpecialties((prevState) => {
      if (prevState[id] >= totalSpecialties) {
        return {
          ...prevState,
          [id]: 3,
        };
      }
      return {
        ...prevState,
        [id]: (prevState[id] || 3) + 3,
      };
    });
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
        <Col xl={6} sm={12}>
          <Select
            showSearch
            placeholder="Tìm theo tên lĩnh vực và chuyên môn"
            onSearch={handleSearch}
            onSelect={handleSearchSelect}
            onInputKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(searchText);
              }
            }}
            filterOption={false}
            allowClear
            style={{ marginBottom: "20px", height: "2.5rem", width: "30rem" }}
            options={
              searchResults.professions && searchResults.professions.length > 0
                ? searchResults.professions.map((pro) => ({
                    label: `${pro.name} (Chuyên môn: ${pro.specialty
                      .map((sp) => getSpecialtyNameById(sp))
                      .join(", ")})`,
                    value: pro._id,
                  }))
                : []
            }
          />
        </Col>
      </Row>
      <Row>
        {displayProfessions.length > 0 ? (
          displayProfessions.map((pro) => (
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
                          pro.specialty
                            .slice(0, visibleSpecialties[pro._id] || 3) // Show only the visible number of specialties (default 3)
                            .map((sp) => (
                              <Popover content="Đang hoạt động" key={sp}>
                                <Tag bordered={true} className="specialty-tags">
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
                                </Tag>
                              </Popover>
                            ))
                        ) : (
                          <Tag className="specialty-tags">
                            Chưa có chuyên môn nào
                          </Tag>
                        )}
                        {/* Show "Xem thêm" if there are more specialties to show */}
                        {pro.specialty.length >
                        (visibleSpecialties[pro._id] || 3) ? (
                          <Tag
                            className="specialty-tags more-tag"
                            onClick={() =>
                              showMoreSpecialties(pro._id, pro.specialty.length)
                            } // Show more specialties when clicked
                            style={{
                              cursor: "pointer",
                            }}
                          >
                            {`+${pro.specialty.length - 3} Xem thêm`}
                          </Tag>
                        ) : (
                          visibleSpecialties[pro._id] >=
                            pro.specialty.length && (
                            <Tag
                              className="specialty-tags more-tag"
                              onClick={() =>
                                showMoreSpecialties(
                                  pro._id,
                                  pro.specialty.length
                                )
                              }
                              style={{
                                cursor: "pointer",
                              }}
                            >
                              Thu gọn
                            </Tag>
                          )
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
    </Container>
  );
};

export default ProfessionManagement;
