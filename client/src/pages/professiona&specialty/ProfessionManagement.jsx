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
  UploadOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  Table,
  Tag,
  Popconfirm,
  Popover,
  Pagination,
  Empty,
  Typography,
  Tooltip,
  Dropdown,
  Menu,
  Space,
} from "antd";
import AddNewProfession from "./AddNewProfession.jsx";
import EditProfession from "./EditProfession.jsx";
import "../../style/Admin/Profession.css";
import UpdateButton from "../../components/Button/UpdateButton.jsx";
import { useLocation } from "react-router-dom";
import ImportNewProfession from "./ImportNewProfession.jsx";

const ProfessionManagement = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const professions = useSelector((state) => state.profession.professions.data);
  const specialtiesData = useSelector(
    (state) => state.profession.specialtiesData.data || []
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalImportFileOpen, setIsModalImportFileOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [professionId, setProfessionId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [expanded, setExpanded] = useState(false);

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

  useEffect(() => {
    if (location.state?.admin) {
      handleOpenModal();
    }
  }, [location.state]);

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
  console.log("dd", specialtiesData);

  const getSpecialtyNameById = (id) => {
    const define = specialtiesData.find((sp) => sp._id === id);
    return define ? define.name : "Unknown";
  };

  const getSpecialtyStatusById = (id) => {
    const define = specialtiesData.find((sp) => sp._id === id);
    return define ? define.status : "false";
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

  const handleOpenImportFileModal = () => {
    setIsModalImportFileOpen(true);
  };

  const handleCloseImportFileModal = () => {
    setIsModalImportFileOpen(false);
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
      title: "STT",
      key: "index",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      width: "10%",
    },
    {
      title: "Tên lĩnh vực",
      dataIndex: "name",
      key: "name",
      width: "20%",
    },
    {
      title: "Tên chuyên môn",
      dataIndex: "specialty",
      key: "specialty",
      render: (specialty) => {
        const handleToggle = () => setExpanded((prev) => !prev);

        return (
          <div>
            {specialty.slice(0, expanded ? specialty.length : 5).map((sp) => (
              <Tooltip
                title={
                  getSpecialtyStatusById(sp)
                    ? "Đang hoạt động"
                    : "Dừng hoạt động"
                }
                key={sp}
              >
                <Tag
                  style={{ marginBottom: "0.3rem" }}
                  color={getSpecialtyStatusById(sp) ? "green" : "red"}
                >
                  {getSpecialtyNameById(sp)}
                </Tag>
              </Tooltip>
            ))}
            {specialty.length > 5 && (
              <Typography.Link onClick={handleToggle}>
                {expanded ? "Thu gọn" : "Xem thêm"}
              </Typography.Link>
            )}
          </div>
        );
      },
      width: "40%",
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
              <div>
                <UnlockOutlined
                  style={{
                    fontSize: "1.2rem",
                    color: "green",
                    cursor: "pointer",
                  }}
                />
                <span
                  style={{
                    color: "green",
                    cursor: "pointer",
                  }}
                >
                  Hoạt động
                </span>
              </div>
            ) : (
              <div>
                <LockOutlined
                  style={{
                    fontSize: "1.2rem",
                    color: "red",
                    cursor: "pointer",
                  }}
                />
                <span
                  style={{
                    color: "red",
                    cursor: "pointer",
                  }}
                >
                  Dừng hoạt động
                </span>
              </div>
            )}
          </Popconfirm>
        </Popover>
      ),
      width: "15%",
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <UpdateButton
          content="Cập nhật"
          onClick={() => handleOpenEditModal(record._id)}
          icon={<EditOutlined />}
        />
      ),
      width: "15%",
    },
  ];

  const items = [
    {
      key: "1",
      label: (
        <div style={{ width: "100%" }} onClick={handleOpenModal}>
          <PlusCircleOutlined /> Thêm thủ công
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div style={{ width: "100%" }} onClick={handleOpenImportFileModal}>
          <UploadOutlined /> Thêm bằng file xlsx
        </div>
      ),
    },
  ];

  return (
    <Container fluid style={{ marginTop: "3rem" }}>
      <AddNewProfession show={isModalOpen} close={handleCloseModal} />
      <ImportNewProfession
        open={isModalImportFileOpen}
        close={handleCloseImportFileModal}
      />
      <EditProfession
        _id={professionId}
        show={isEditModalOpen}
        close={handleCloseEditModal}
      />
      <Row style={{ marginBottom: "10px" }}>
        <Col>
          <Dropdown
            menu={{
              items,
            }}
            placement="bottomRight"
            arrow
            trigger={["click"]}
          >
            <Button type="primary">
              <Space>
                <PlusCircleOutlined /> Thêm lĩnh vực & chuyên môn
              </Space>
            </Button>
          </Dropdown>
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
          hideOnSinglePage
        />
      </Row>
    </Container>
  );
};

export default ProfessionManagement;
