import React, { useEffect, useMemo, useState } from "react";
import SmallModal from "../../components/Modal/SmallModal.jsx";
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Col,
  Empty,
  List,
  Pagination,
  Popconfirm,
  Row,
  Tooltip,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import Search from "antd/es/transfer/search.js";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useParams } from "react-router-dom";
import {
  setTotalWaitUsers,
  setWaitUserList,
} from "../../redux/slice/TempGroupSlice.js";
import avatarImage from "../../assets/images/459233558_122150574488258176_5118808073589257292_n.jpg";
import { CiMail } from "react-icons/ci";
import { UserOutlined } from "@ant-design/icons";

const AddStudent = ({ groupKey, maxStudent, currentStudents, show, close }) => {
  const dispatch = useDispatch();
  const { className } = useParams();
  const [classId, setClassId] = useState(null);
  const jwt = localStorage.getItem("jwt");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [checkedItems, setCheckedItems] = useState({});
  const [remainingSlots, setRemainingSlots] = useState(
    maxStudent - currentStudents
  ); 

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  // Fetch Class ID
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/className/${className}`,
          config
        );
        setClassId(response.data?.classId);
      } catch (error) {
        console.error(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [config, className]);

  // Danh sách những sinh viên chưa join vào nhóm
  useEffect(() => {
    if (!classId) return;
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/ungroup/${classId}`,
          {
            ...config,
            params: {
              skip: currentPage,
              limit: pageSize,
            },
          }
        );
        dispatch(setWaitUserList(response.data?.data));
        dispatch(setTotalWaitUsers(response.data?.total));
        setTotalItems(response.data?.total);
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [classId, config, currentPage, pageSize, dispatch]);

  const waitUserList = useSelector(
    (state) => state.tempGroup.waituserlist || []
  );

  const onPageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const onPageSizeChange = (current, size) => {
    setPageSize(size);
    setCurrentPage(current);
  };

  const filteredUsers = waitUserList.filter((user) => {
    if (
      searchText &&
      !(
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.rollNumber?.toLowerCase().includes(searchText.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });

  // Xử lý checkbox
  const handleCheckboxChange = (userId) => {
    setCheckedItems((prev) => {
      const isChecked = !prev[userId];
      const newCheckedItems = { ...prev, [userId]: isChecked };

      // Cập nhật remainingSlots dựa trên trạng thái của checkbox
      setRemainingSlots((prevSlots) => prevSlots + (isChecked ? -1 : 1));

      return newCheckedItems;
    });
  };

  const itemStyle = {
    display: "flex",
    alignItems: "center",
    padding: "8px",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    borderBottom: "1px solid #f0f0f0",
  };

  const contentStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flexGrow: 1,
  };

  const usernameStyle = {
    fontSize: "1.1em",
    fontWeight: "bold",
    lineHeight: "1.2em",
    marginBottom: "4px",
  };

  const detailsStyle = {
    fontSize: "0.9em",
    color: "#666",
    lineHeight: "1.1em",
  };

  const modalBody = (
    <Row>
      <Col sm={24} md={24} lg={24}>
        <Row>
          <Col sm={24}>
            <h6 style={{ fontWeight: "450", fontStyle: "italic" }}>
              Thành viên hiện tại trong nhóm{" "}
              <span style={{ fontWeight: "500" }}>
                {currentStudents}/{maxStudent}{" "}
                <UserOutlined style={{ fontWeight: "500" }} />
              </span>{" "}
            </h6>
          </Col>
        </Row>
        <h5 style={{ marginTop: "2rem" }}>Danh sách sinh viên chưa có nhóm</h5>
        <Row>
          <Col
            sm={24}
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "5px",
              marginBottom: "15px",
              alignItems: "center",
            }}
          >
            <Search
              placeholder="Nhập tên, email hoặc MSSV"
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "90%" }}
            />
          </Col>
        </Row>
        <Row style={{ marginBottom: "1.2rem" }}>
          <Col sm={24}>
            Số lượng sinh viên chưa nhóm: {waitUserList.length}{" "}
            <UserOutlined style={{ fontWeight: "500" }} />
          </Col>
        </Row>
        <Row style={{ fontStyle: "italic", margin: "10px auto" }}>
          <Col sm={24}>
            <Alert
              style={{ width: "fit-content" }}
              message={
                <div>
                  Bạn có thể thêm tối đa{" "}
                  <span
                    style={{
                      fontWeight: "bold",
                      color: remainingSlots === 0 ? "red" : "green",
                    }}
                  >
                    {remainingSlots}
                  </span>{" "}
                  thành viên mới
                </div>
              }
              type="warning"
              showIcon
            />
          </Col>
        </Row>
        {waitUserList.length > 0 ? (
          <List
            className="list-container-groupstudent"
            style={{ width: "100%" }}
            bordered
            dataSource={filteredUsers}
            renderItem={(user) => (
              <Checkbox
                className="custom-checkbox"
                checked={checkedItems[user._id] || false}
                onChange={() => handleCheckboxChange(user._id)}
                style={{ width: "100%", paddingLeft: "1.4rem" }}
                disabled={
                  remainingSlots <= 0 && !checkedItems[user._id] // Vô hiệu hóa nếu đã chọn đủ
                }
              >
                <List.Item style={itemStyle}>
                  <Avatar src={avatarImage} style={{ marginRight: "8px" }} />
                  <div style={contentStyle} key={user._id}>
                    <div style={usernameStyle}>
                      {user.username} -{" "}
                      <span style={detailsStyle}>{user.rollNumber}</span>
                    </div>
                    <div style={detailsStyle}>
                      <div style={{ display: "flex", textAlign: "center" }}>
                        <span style={{ fontWeight: "500" }}>Email:</span>
                        &nbsp;{user.email}
                      </div>
                      {/* <div>MSSV: {user.rollNumber}</div> */}
                    </div>
                  </div>
                </List.Item>
              </Checkbox>
            )}
          />
        ) : (
          <Empty />
        )}

        <Row style={{ marginTop: "1rem" }}>
          <Pagination
            showQuickJumper
            style={{
              display: "block",
              justifyContent: "center",
              width: "fit-content",
              margin: "0 auto",
              textAlign: "center",
            }}
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={onPageChange}
            onShowSizeChange={onPageSizeChange}
          />
        </Row>
      </Col>
    </Row>
  );

  const modalFooter = (
    <div style={{ display: "flex", gap: "1rem", justifyContent: "end" }}>
      <Tooltip title="Bạn phải chọn ít nhất 1 thành viên" d>
        <Popconfirm
          title="Bạn có chắc chắn muốn thêm các sinh viên đã chọn vào nhóm không?"
          onConfirm={() => {
            console.log("Đã xác nhận thêm thành viên");
          }}
          okText="Có"
          cancelText="Không"
        >
          <Button type="primary">Thêm vào</Button>
        </Popconfirm>
      </Tooltip>
      <Button onClick={close}>Hủy</Button>
    </div>
  );

  return (
    <div>
      <SmallModal
        title={
          <h3>
            <span style={{ fontWeight: "500" }}>
              Thêm thành viên mới - {groupKey}
            </span>
          </h3>
        }
        content={modalBody}
        footer={modalFooter}
        isModalOpen={show}
        handleOk={showConfirmModal}
        handleCancel={close}
        closeable={true}
      ></SmallModal>
    </div>
  );
};

export default AddStudent;
