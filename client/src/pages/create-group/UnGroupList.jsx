import {
  Card,
  FloatButton,
  Row,
  Col,
  List,
  Avatar,
  Splitter,
  Typography,
  Empty,
  Pagination,
  Button,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { QuestionCircleOutlined, UserOutlined } from "@ant-design/icons";
import {
  setTempGroups,
  setTotalTempGroups,
  setTotalWaitUsers,
  setWaitUserList,
} from "../../redux/slice/TempGroupSlice";

import { setClassTaskData } from "../../redux/slice/ClassManagementSlice";
import "../../style/Class/ClassDetail.css";
import Search from "antd/es/input/Search";
import CreateGroup from "./CreateGroup";
import Result from "./DnD_Group/Result";
const UnGroupList = () => {
  const { className } = useParams();
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const [classId, setClassId] = useState("");
  //Tìm kiếm
  const [searchText, setSearchText] = useState("");
  //Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [isModalShowTypeAdd, setIsModalShowTypeAdd] = useState(false);
  const userId = localStorage.getItem("userId");

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/task/${userId}`,
          config
        );
        dispatch(setClassTaskData(response.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [userId, config, dispatch]);

  const classTask = useSelector((state) => state.classManagement.classtask) || {
    data: [],
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/className/${className}`,
          config
        );
        setClassId(response.data?.classId);
        console.log("classId: " + response.data?.classId);
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [className, config]);

  //Danh sách những nhóm đã join vào group chưa đến hạn hết được join nhóm
  useEffect(() => {
    if (!classId) return;
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/tempgroup/class/${classId}`,
          config
        );
        dispatch(setTempGroups(response.data?.data));
        dispatch(setTotalTempGroups(response.data?.total));
        console.log("Fetch data: " + JSON.stringify(response.data.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [classId, config, dispatch]);

  //Danh sách những sinh viên chưa join vào nhóm
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
        console.log("Fetch data: " + JSON.stringify(response.data.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [classId, config, currentPage, pageSize, dispatch]);

  const tempGroups = useSelector((state) => state.tempGroup.data || []);
  const totalTempGroups = useSelector((state) => state.tempGroup.total || 0);
  const waitUserList = useSelector(
    (state) => state.tempGroup.waituserlist || []
  );
  const totalWaitUsers = useSelector((state) => state.tempGroup.waittotal || 0);
  console.log("Fetch data redux: " + JSON.stringify(tempGroups));
  console.log("Fetch total data redux: " + totalTempGroups);

  const onPageChange = (pageNumber) => {
    console.log(`Changing to page: ${pageNumber}`);
    setCurrentPage(pageNumber);
  };

  const onPageSizeChange = (current, size) => {
    console.log(`Changing page size to: ${size}`);
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

  const handleOpenAddTypeModal = () => {
    setIsModalShowTypeAdd(true);
  };
  const handleCloseAddTypeModal = () => {
    setIsModalShowTypeAdd(false);
  };

  return (
    <div>
      <CreateGroup show={isModalShowTypeAdd} close={handleCloseAddTypeModal} />
      <h1>Lớp {className}</h1>
      <Card
        bordered={true}
        style={{
          display: "flex",
          justifyContent: "start",
          width: "80%",
          padding: "0.5rem 8rem 0.5rem 0.5rem",
          borderStyle: "dotted",
          backgroundColor: "#E6F4FF",
          border: "2px solid #1677FF",
          lineHeight:'1rem',
          marginBottom:'2rem'
        }}
      >
        <p >Sĩ số lớp: 25 sinh viên</p>
        <p>Tổng số nhóm đã đủ thành viên: ?</p>
        <p>Deadline tạo nhóm và thời gian còn lại </p>
        <p>Điều kiện tham gia nhóm: </p>
      </Card>

      <Button
        type="primary"
        style={{
          margin: "20px 0px",
          display: totalTempGroups > 0 ? "none" : "block",
        }}
        onClick={handleOpenAddTypeModal}
      >
        + Tạo nhóm lớp
      </Button>
      <FloatButton
        icon={<QuestionCircleOutlined />}
        type="primary"
        style={{
          insetInlineEnd: 88,
        }}
      />
      <Splitter
        style={{
          height: "100%",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Splitter.Panel
          collapsible
          style={{
            width: "17rem",
            maxWidth: "17rem",
          }}
        >
          <Typography.Title
            type="secondary"
            level={5}
            style={{
              whiteSpace: "normal",
              wordWrap: "break-word",
            }}
          >
            <Row>
              <Col
                sm={24}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "15px",
                }}
              >
                <p style={{ color: "black", fontStyle: "bold" }}>
                  Danh sách sinh viên chưa có nhóm
                </p>
              </Col>
            </Row>
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
                {/* <button onClick={resetSearch} style={{ marginLeft: "10px" }}>
                  Reset
                </button> */}
              </Col>
            </Row>
            <Row style={{ margin: "10px auto" }}>
              <Col sm={24}>Số lượng sinh viên chưa nhóm: {totalWaitUsers}</Col>
            </Row>
            {totalWaitUsers > 0 ? (
              <List
                className="list-container-groupstudent"
                style={{
                  width: "100%",
                }}
                itemLayout="horizontal"
                dataSource={filteredUsers}
                renderItem={(user, index) => (
                  <List.Item
                    key={user?._id}
                    style={{ marginLeft: "0px", paddingLeft: "10px" }}
                    className="list-groupstudent"
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={<p className="list-title">{user?.username}</p>}
                      description={
                        <p className="list-description">
                          {
                            <p style={{ fontWeight: "500" }}>
                              <span style={{ fontWeight: "700" }}>MSSV:</span>
                              &nbsp;
                              {user?.rollNumber}
                            </p>
                          }
                          {
                            <p style={{ fontWeight: "500" }}>
                              <span style={{ fontWeight: "700" }}>Email:</span>
                              &nbsp;
                              {user?.email}
                            </p>
                          }
                        </p>
                      }
                    />
                  </List.Item>
                )}
              ></List>
            ) : (
              <Empty />
            )}
            <Row>
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
                itemRender={(page, type, originalElement) => {
                  if (type === "page") {
                    return <a style={{ padding: "0 4px" }}>{page}</a>;
                  }
                  return originalElement;
                }}
              />
            </Row>
          </Typography.Title>
        </Splitter.Panel>
        <Splitter.Panel
          collapsible={false}
          style={{
            flex: 1,
          }}
        >
          <Row style={{ margin: "10px 20px" }}>
            <Col sm={24}>Số lượng sinh viên đã vào nhóm: 14</Col>
          </Row>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            <Result className={className} />
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default UnGroupList;
