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
  UnlockOutlined,
  LockOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import {
  Table,
  Tag,
  Popconfirm,
  Popover,
  Pagination,
  Empty,
  Typography,
} from "antd";
import AddNewProfession from "./AddNewProfession.jsx";
import EditProfession from "./EditProfession.jsx";
import "../../style/Admin/Profession.css";

const ProfessionManagement = () => {
  const dispatch = useDispatch();
  const professions = useSelector((state) => state.profession.professions.data);
  const specialties = useSelector(
    (state) => state.specialty.specialties.data || []
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [professionId, setProfessionId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(6);

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

  const fetchSpecialties = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/specialty`);
      const data = response.data;
      dispatch(setSpecialtiesData(data));
    } catch (error) {
      console.error("Error fetching specialties:", error);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, [dispatch]);

  const getSpecialtyNameById = (id) => {
    const define = specialties.find((sp) => sp._id === id);
    return define ? define.name : "Unknown";
  };

  const toggleStatus = (id, currentStatus) => {
    const updatedStatus = { status: !currentStatus };

    axios
      .patch(`${BASE_URL}/profession/${id}`, updatedStatus)
      .then(() => {
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
    setCurrentPage(pageNumber);
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

  const columns = [
    {
      title: "Tên lĩnh vực",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Chuyên môn",
      dataIndex: "specialty",
      key: "specialty",
      render: (specialty) =>
        specialty.length > 0 ? (
          specialty.map((sp) => <Tag key={sp}>{getSpecialtyNameById(sp)}</Tag>)
        ) : (
          <Tag>Chưa có chuyên môn nào</Tag>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Popover content={status ? "Đang hoạt động" : "Chưa hoạt động"}>
          <Popconfirm
            title="Đổi trạng thái hoạt động"
            onConfirm={() => toggleStatus(record._id, status)}
            okText="Có"
            cancelText="Hủy"
          >
            {status ? (
              <UnlockOutlined
                style={{
                  fontSize: "1.2rem",
                  color: "green",
                  cursor: "pointer",
                }}
              />
            ) : (
              <LockOutlined
                style={{ fontSize: "1.2rem", color: "red", cursor: "pointer" }}
              />
            )}
          </Popconfirm>
        </Popover>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Button
          onClick={() => handleOpenEditModal(record._id)}
          icon={<EditOutlined />}
        >
          Cập nhật
        </Button>
      ),
    },
  ];

  return (
    <Container fluid>
      <AddNewProfession show={isModalOpen} close={handleCloseModal} />
      <EditProfession
        _id={professionId}
        show={isEditModalOpen}
        close={handleCloseEditModal}
      />
      <Row style={{ marginBottom: "20px" }}>
        <Col>
          <Typography.Title level={2} style={{ textAlign: "center" }}>
            Quản lý lĩnh vực
          </Typography.Title>
        </Col>
      </Row>
      <Row style={{ marginBottom: "10px" }}>
        <Col>
          <Button
            variant="primary"
            onClick={handleOpenModal}
            icon={<PlusCircleOutlined />}
          >
            Thêm lĩnh vực
          </Button>
        </Col>
      </Row>
      <Row>
        {professions.length > 0 ? (
          <Table
            columns={columns}
            dataSource={professions}
            rowKey="_id"
            pagination={false}
          />
        ) : (
          <Empty />
        )}
      </Row>
      <Row>
        <Pagination
          showQuickJumper
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={onPageChange}
          style={{ marginTop: "20px", textAlign: "center" }}
        />
      </Row>
    </Container>
  );
};

export default ProfessionManagement;
