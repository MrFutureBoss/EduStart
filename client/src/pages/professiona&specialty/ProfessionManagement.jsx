import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import {
  setProfessions,
  setSpecialtiesData,
} from "../../redux/slice/ProfessionSlice.js";
import { setSpecialties } from "../../redux/slice/SpecialtySlice.js";
import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import {
  EditOutlined,
  UnlockOutlined,
  LockOutlined,
  PlusCircleOutlined,
  UploadOutlined,
  DownOutlined,
  SearchOutlined,
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
  Space,
  Input,
} from "antd";
import AddNewProfession from "./AddNewProfession.jsx";
import EditProfession from "./EditProfession.jsx";
import "../../style/Admin/Profession.css";
import UpdateButton from "../../components/Button/UpdateButton.jsx";
import { useLocation } from "react-router-dom";
import ImportNewProfession from "./ImportNewProfession.jsx";
import Highlighter from "react-highlight-words";

const ProfessionManagement = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const professions = useSelector((state) => state.profession.professions.data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalImportFileOpen, setIsModalImportFileOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [professionId, setProfessionId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const [expandedRows, setExpandedRows] = useState({}); 

  const toggleRowExpansion = (rowKey) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

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

  const getColumnSearchProps = (dataIndex, isNested = false) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Tìm kiếm`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Tìm
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Xóa
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) => {
      const fieldValue = isNested
        ? record[dataIndex].map((item) => item.name).join(", ")
        : record[dataIndex];
      return fieldValue
        ? fieldValue.toString().toLowerCase().includes(value.toLowerCase())
        : false;
    },
    render: (text, record) => {
      if (isNested) {
        const specialties = record[dataIndex];
        const isExpanded = expandedRows[record._id] || false;
        const displayedSpecialties = isExpanded ? specialties : specialties.slice(0, 3);
  
        return (
          <div>
            {displayedSpecialties.map((item) => (
              <Tag key={item.name} color={item.status ? "green" : "red"}>
                <Highlighter
                  highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                  searchWords={[searchText]}
                  autoEscape
                  textToHighlight={item.name}
                />
              </Tag>
            ))}
            {specialties.length > 3 && (
              <Typography.Link onClick={() => toggleRowExpansion(record._id)}>
                {isExpanded ? "Thu gọn" : "Xem thêm..."}
              </Typography.Link>
            )}
          </div>
        );
      }
      return searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      );
    },
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
      width: "10%",
    },
    {
      title: "Tên lĩnh vực",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
      width: "20%",
    },
    {
      title: "Tên chuyên môn",
      dataIndex: "specialty",
      key: "specialty",
      ...getColumnSearchProps("specialty", true), // Search for nested specialty
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
