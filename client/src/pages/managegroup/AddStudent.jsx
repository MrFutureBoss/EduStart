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
  Tag,
  Tooltip,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import Search from "antd/es/transfer/search.js";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useParams } from "react-router-dom";
import {
  setTempGroups,
  setTotalTempGroups,
  setTotalWaitUsers,
  setWaitUserList,
} from "../../redux/slice/TempGroupSlice.js";
import avatarImage from "../../assets/images/459233558_122150574488258176_5118808073589257292_n.jpg";
import { CiMail } from "react-icons/ci";
import { PlusOutlined, StopOutlined, UserOutlined } from "@ant-design/icons";

const AddStudent = ({ groupKey, maxStudent, currentStudents, show, close }) => {
  const dispatch = useDispatch();
  const { className } = useParams();
  const [classId, setClassId] = useState(null);
  const jwt = localStorage.getItem("jwt");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(4);
  const [checkedItems, setCheckedItems] = useState({});
  const [waitUserList, setWaitUserList2] = useState([]);
  const [groupData, setGroupData] = useState(null);
  const [majorCounts, setMajorCounts] = useState({});
  const [allMajors, setAllMajors] = useState([]);
  const [remainingSlots, setRemainingSlots] = useState(
    maxStudent - currentStudents
  );

  useEffect(() => {
    setRemainingSlots(maxStudent - currentStudents);
    setCheckedItems({});
  }, [groupKey, maxStudent, currentStudents]);

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
        setWaitUserList2(response.data?.data);
        setTotalItems(response.data?.total);
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [classId, config, currentPage, pageSize, dispatch, show]);

  useEffect(() => {
    if (groupKey) {
      const fetchGroupData = async () => {
        try {
          const response = await axios.get(
            `${BASE_URL}/tempgroup/name/${groupKey}`,
            config
          );
          setGroupData(response.data);
          setRemainingSlots(
            response.data.maxStudent - response.data.userIds.length
          );
          const majorCountData = response.data.userIds.reduce((acc, user) => {
            const major = user.major; 

            if (!acc[major]) {
              acc[major] = { count: 0, originalMajor: major };
            }
            acc[major].count += 1;
            return acc;
          }, {});

          setMajorCounts(majorCountData);
        } catch (error) {
          console.error("Error fetching group data:", error);
        }
      };
      fetchGroupData();
    }
  }, [groupKey, config, show]);

  const fetchGroups = async () => {
    if (!classId) return;
    try {
      const response = await axios.get(
        `${BASE_URL}/tempgroup/class/${classId}`,
        config
      );
      dispatch(setTempGroups(response.data?.data));
      dispatch(setTotalTempGroups(response.data?.total));
    } catch (error) {
      console.error(
        error.response ? error.response.data.message : error.message
      );
    }
  };

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

  useEffect(() => {
    if (groupKey) {
      const fetchGroupData = async () => {
        try {
          const response = await axios.get(
            `${BASE_URL}/tempgroup/name/${groupKey}`,
            config
          );
          setGroupData(response.data);
          setRemainingSlots(
            response.data.maxStudent - response.data.userIds.length
          );

          const majorCountData = response.data.userIds.reduce((acc, user) => {
            const major = user.major;
          
            if (!acc[major]) {
              acc[major] = { count: 0, originalMajor: major };
            }
            acc[major].count += 1;
            return acc;
          }, {});
          
          setMajorCounts(majorCountData);

          // Combine all initial majors into an array
          const initialMajorsArray = Object.keys(majorCountData).reduce(
            (acc, major) => {
              for (let i = 0; i < majorCountData[major].count; i++) {
                acc.push(major);
              }
              return acc;
            },
            []
          );
          setAllMajors(initialMajorsArray);
        } catch (error) {
          console.error("Error fetching group data:", error);
        }
      };
      fetchGroupData();
    }
  }, [groupKey, config]);

  const handleCheckboxChange = (userId, major) => {
    setCheckedItems((prev) => {
      const isChecked = !prev[userId];
      const newCheckedItems = { ...prev, [userId]: isChecked };
      setRemainingSlots((prevSlots) => prevSlots + (isChecked ? -1 : 1));

      // Update allMajors array
      setAllMajors((prevMajors) => {
        const updatedMajors = [...prevMajors];
        if (isChecked) {
          updatedMajors.push(major);
        } else {
          const index = updatedMajors.indexOf(major);
          if (index !== -1) updatedMajors.splice(index, 1);
        }
        return updatedMajors;
      });

      return newCheckedItems;
    });
  };

  useEffect(() => {
    if (!show) {
      setCheckedItems({});
      setAllMajors([]);
    }
  }, [show]);

  const handleAddMembers = async () => {
    try {
      const selectedUserIds = Object.keys(checkedItems).filter(
        (id) => checkedItems[id]
      );
      const groupId = groupData?._id;
  
      // Xác định status dựa trên số lượng userIds và maxStudent
      const updatedUserIds = [
        ...groupData.userIds.map((user) => user._id),
        ...selectedUserIds,
      ];
      const status = updatedUserIds.length >= maxStudent;
  
      // Gọi API để cập nhật members và status
      await axios.put(
        `${BASE_URL}/tempgroup/${groupId}`,
        {
          userIds: updatedUserIds,
          status: status, // Truyền status vào cùng với userIds
        },
        config
      );
  
      // Cập nhật danh sách sinh viên chờ trong Redux, loại bỏ các ID đã chọn
      dispatch(
        setWaitUserList(
          waitUserList.filter((user) => !selectedUserIds.includes(user._id))
        )
      );
  
      // Cập nhật tổng số người dùng chờ
      dispatch(setTotalWaitUsers(totalItems - selectedUserIds.length));
  
      // Lấy dữ liệu mới của nhóm sau khi thêm thành viên
      await fetchGroups();
  
      // Đóng modal và reset các trạng thái cần thiết
      close();
      setCheckedItems({});
      setSearchText("");
      setCurrentPage(0);
      setRemainingSlots(maxStudent - currentStudents);
      setGroupData(null);
      setMajorCounts({});
  
      console.log("Members added, modal closed, and data reset.");
    } catch (error) {
      console.error("Error updating group:", error);
    }
  };  
  
  const majorAlertMessages = Object.entries(majorCounts).map(
    ([major, info]) => {
      const majorTotalCount = allMajors.filter((m) => m === major).length;
      return {
        major: info.originalMajor,
        message: `Chú ý: Bạn đang chọn tất cả thành viên cùng chuyên ngành ${info.originalMajor}. Điều này có thể không tối ưu cho nhóm.`,
        display: majorTotalCount >= maxStudent,
      };
    }
  );

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
        <Row>
          <Col sm={24}>
            <h6 style={{ fontWeight: "450", fontStyle: "italic" }}>
              Chuyên ngành đã có:{" "}
              <span style={{ fontWeight: "500" }}>
                {Object.entries(majorCounts).map(([major, info]) => (
                  <Tooltip
                    key={major}
                    title={
                      <p>
                        Có {info.count} thành viên chuyên ngành{" "}
                        {info.originalMajor}
                      </p>
                    }
                  >
                    <Tag color="#108ee9" style={{ height: "fit-content" }}>
                      <span
                        style={{
                          borderRight: "1px solid #FFF",
                          paddingRight: "0.4rem",
                        }}
                      >
                        {major}
                      </span>
                      <span
                        style={{
                          paddingLeft: "0.3rem",
                        }}
                      >
                        {info.count} <UserOutlined />
                      </span>
                    </Tag>
                  </Tooltip>
                ))}
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
                </div>
              }
              type="info"
              showIcon
            />
          </Col>
        </Row>
        {majorAlertMessages.map((alert) => {
          // console.log(`Displaying alert for ${alert.major}:`, alert.display);
          return (
            <Row
              key={alert.major}
              style={{ fontStyle: "italic", margin: "10px auto" }}
            >
              <Col sm={24}>
                {alert.display && (
                  <Alert
                    type="warning"
                    message={alert.message}
                    showIcon
                    style={{ marginBottom: "10px" }}
                  />
                )}
              </Col>
            </Row>
          );
        })}

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
                onChange={() => handleCheckboxChange(user._id, user.major)}
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
                        <span style={{ fontWeight: "500" }}>Chuyên ngành:</span>
                        &nbsp;{user.major}
                      </div>
                      <div style={{ display: "flex", textAlign: "center" }}>
                        <span style={{ fontWeight: "500" }}>Email:</span>
                        &nbsp;{user.email}
                      </div>
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
      {remainingSlots < maxStudent - currentStudents ? (
        <Popconfirm
          title="Bạn có chắc chắn muốn thêm các sinh viên đã chọn vào nhóm không?"
          onConfirm={handleAddMembers}
          okText="Có"
          cancelText="Không"
        >
          <Button color="success">
            <PlusOutlined /> Thêm vào
          </Button>
        </Popconfirm>
      ) : (
        <Tooltip title="Bạn phải chọn ít nhất 1 thành viên">
          <Button disabled={true} color="primary">
            <StopOutlined />
            Thêm vào
          </Button>
        </Tooltip>
      )}
      <Button onClick={close} color="danger" variant="solid">
        Hủy
      </Button>
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
