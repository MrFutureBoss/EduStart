import React, { useEffect, useMemo, useState } from "react";
import {
  Tabs,
  Card,
  Col,
  Row,
  Pagination,
  Descriptions,
  Avatar,
  Tooltip,
  Button,
  Drawer,
  Tag,
  Popconfirm,
  message,
  Modal,
  Input,
  Badge,
  Empty,
} from "antd";
import { StarFilled, CalendarOutlined, PlusOutlined } from "@ant-design/icons";
import { BASE_URL } from "../../utilities/initalValue";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setMatchedGroups } from "../../redux/slice/MatchedGroupSlice";
import "../../style/Mentor/GroupList.css";
import CancelButton from "../../components/Button/CancelButton";
import ConfirmButton from "../../components/Button/ConfirmButton";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { FaClock, FaThumbtack } from "react-icons/fa";
import { TiEdit } from "react-icons/ti";
import { BiDetail } from "react-icons/bi";
import CreateMeetingDay from "./CreateMeetingDay";

const GroupList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [declineMessage, setDeclineMessage] = useState("");
  const [selectedGroupToReject, setSelectedGroupToReject] = useState(null);
  const [currentPageMyGroups, setCurrentPageMyGroups] = useState(1);
  const [currentPagePendingGroups, setCurrentPagePendingGroups] = useState(1);
  const pageSize = 3;

  const groups = useSelector((state) => state.matchedGroup.data || []);

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
      setLoading(true);
      try {
        const groupResponse = await axios.get(
          `${BASE_URL}/matched/mentor/${userId}`,
          config
        );
        dispatch(setMatchedGroups(groupResponse.data?.groups));
      } catch (error) {
        console.error(
          error.response ? error.response.data.message : error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [config, dispatch, userId]);

  const [activeTab, setActiveTab] = useState("myGroups");
  const [selectedGroup, setSelectedGroup] = useState(null);

  const myGroups = useMemo(
    () => groups.filter((group) => group.matchedDetails.status === "Accepted"),
    [groups]
  );

  const pendingGroups = useMemo(
    () => groups.filter((group) => group.matchedDetails.status === "Pending"),
    [groups]
  );

  useEffect(() => {
    if (activeTab === "myGroups" && myGroups.length > 0) {
      setSelectedGroup(myGroups[0]);
    } else if (activeTab === "pending" && pendingGroups.length > 0) {
      setSelectedGroup(pendingGroups[0]);
    }
  }, [activeTab, myGroups, pendingGroups]);

  const paginatedMyGroups = useMemo(() => {
    const start = (currentPageMyGroups - 1) * pageSize;
    return myGroups.slice(start, start + pageSize);
  }, [myGroups, currentPageMyGroups]);

  const paginatedPendingGroups = useMemo(() => {
    const start = (currentPagePendingGroups - 1) * pageSize;
    return pendingGroups.slice(start, start + pageSize);
  }, [pendingGroups, currentPagePendingGroups]);

  const showMemberDetails = (member) => {
    setSelectedMember(member);
    setIsDrawerVisible(true);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
    setSelectedMember(null);
  };

  const handleApprove = async (matchedDetailsId) => {
    setLoading(true);
    try {
      // API request để cập nhật trạng thái của matchedDetails sang "Accepted"
      await axios.patch(
        `${BASE_URL}/matched/${matchedDetailsId}`,
        { status: "Accepted" },
        config
      );

      // Cập nhật lại dữ liệu Redux
      const updatedGroups = groups.map((group) => {
        if (group.matchedDetails._id === matchedDetailsId) {
          return {
            ...group,
            matchedDetails: {
              ...group.matchedDetails,
              status: "Accepted",
            },
          };
        }
        return group;
      });

      dispatch(setMatchedGroups(updatedGroups));
      message.success("Nhóm đã được phê duyệt thành công!");

      // Chuyển sang tab "Nhóm của bạn" và chọn card vừa phê duyệt
      setActiveTab("myGroups");
      const approvedGroup = updatedGroups.find(
        (group) => group.matchedDetails._id === matchedDetailsId
      );
      if (approvedGroup) {
        setSelectedGroup(approvedGroup);
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi phê duyệt nhóm.");
      console.error(
        error.response ? error.response.data.message : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const showRejectModal = (group) => {
    setSelectedGroupToReject(group);
    setIsRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!selectedGroupToReject) return;

    setLoading(true);
    try {
      // Gửi request để từ chối nhóm
      await axios.patch(
        `${BASE_URL}/matched/${selectedGroupToReject.matchedDetails._id}`,
        { status: "Rejected", declineMessage },
        config
      );

      // Cập nhật Redux state
      const updatedGroups = groups.map((group) => {
        if (
          group.matchedDetails._id === selectedGroupToReject.matchedDetails._id
        ) {
          return {
            ...group,
            matchedDetails: {
              ...group.matchedDetails,
              status: "Rejected",
              declineMessage,
            },
          };
        }
        return group;
      });

      dispatch(setMatchedGroups(updatedGroups));
      message.success("Bạn đã từ chối nhóm đó thành công");
      message.info("Lí do của bạn đã được gửi tới giáo viên phụ trách nhóm đó");

      // Đóng Modal và reset lại giá trị
      setIsRejectModalVisible(false);
      setDeclineMessage("");
      setSelectedGroupToReject(null);

      // Di chuyển về tab "Chờ duyệt"
      setActiveTab("pending");

      // Tự động chọn card đầu tiên trong tab "Chờ duyệt"
      if (pendingGroups.length > 0) {
        setSelectedGroup(pendingGroups[0]);
      } else {
        setSelectedGroup(null);
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi từ chối nhóm.");
      console.error(
        error.response ? error.response.data.message : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToSchedule = async () => {
    navigate("/mentor-dashboard/schedule");
  };

  const HandleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const HandleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  return (
    <div>
      <CreateMeetingDay open={isAddModalOpen} close={HandleCloseAddModal} />
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Quản lý nhóm
      </h1>
      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          md={6}
          style={{
            maxHeight: "700px",
            overflowY: "auto",
            backgroundColor: "#F0F2F5",
          }}
        >
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            style={{
              backgroundColor: "#1890ff",
              borderColor: "#1890ff",
              width: "100%",
              padding: "20px 0px",
              marginBottom: "2rem",
              fontSize: "1.1rem",
            }}
            onClick={() => handleMoveToSchedule()}
          >
            Lịch họp các nhóm
          </Button>
          <Tabs
            type="card"
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            defaultActiveKey="myGroups"
            style={{ marginBottom: "20px" }}
          >
            <Tabs.TabPane
              key="myGroups"
              tab={
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span>Nhóm của bạn</span>
                  <Badge
                    count={myGroups.length}
                    showZero
                    style={{
                      backgroundColor: "#52c41a",
                    }}
                  />
                </div>
              }
            >
              {paginatedMyGroups.map((group, index) => (
                <Card
                  key={index}
                  bordered={false}
                  className={`mentor-group-card ${
                    selectedGroup === group ? "mentor-group-card-selected" : ""
                  }`}
                  onClick={() => setSelectedGroup(group)}
                  hoverable
                >
                  <div>
                    <h4 style={{ marginBottom: "8px", fontSize: "18px" }}>
                      Dự án: {group.project.name}
                    </h4>
                    <p style={{ marginBottom: "4px" }}>
                      Lớp: {group.class.className} - {group.group.name}
                    </p>
                  </div>
                </Card>
              ))}
              <Pagination
                current={currentPageMyGroups}
                pageSize={pageSize}
                total={myGroups.length}
                onChange={(page) => setCurrentPageMyGroups(page)}
                style={{ textAlign: "center", marginTop: "20px" }}
              />
            </Tabs.TabPane>
            <Tabs.TabPane
              key="pending"
              disabled={pendingGroups.length === 0}
              tab={
                <Tooltip
                  title={
                    pendingGroups.length === 0
                      ? "Hiện tại không có nhóm mới nào"
                      : null
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>Chờ duyệt</span>
                    <Badge count={pendingGroups.length} showZero />
                  </div>
                </Tooltip>
              }
            >
              <div style={{ padding: "10px" }}>
                {paginatedPendingGroups.map((group, index) => (
                  <Card
                    key={index}
                    bordered={false}
                    className={`mentor-group-card ${
                      selectedGroup === group
                        ? "mentor-group-card-selected"
                        : ""
                    }`}
                    onClick={() => setSelectedGroup(group)}
                    hoverable
                  >
                    <div>
                      <h4 style={{ marginBottom: "8px", fontSize: "18px" }}>
                        Dự án: {group.project.name}
                      </h4>
                      <p style={{ marginBottom: "4px" }}>
                        Lớp: {group.class.className} - {group.group.name}
                      </p>
                      <p>
                        Thể loại dự án:{" "}
                        {group.projectCategory?.profession.map((profession) => (
                          <Tag
                            key={`profession-${profession._id}`}
                            color="blue"
                          >
                            {profession.name}
                          </Tag>
                        ))}
                      </p>
                      <p
                        className="remove-default-style-p"
                        style={{
                          fontWeight: "500",
                          fontSize: "0.8rem",
                          marginBottom: "0.4rem",
                          color: "red",
                        }}
                      >
                        Thời gian phản hồi: Còn 2 ngày (tạm fix cứng)
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          justifyContent: "end",
                        }}
                      >
                        <Popconfirm
                          title={`Bạn có chắc chắn nhận ${group.group?.name} vào danh sách nhóm hỗ trợ không?`}
                          onConfirm={() =>
                            handleApprove(group.matchedDetails._id)
                          }
                          okText="Đồng ý"
                          cancelText="Hủy"
                        >
                          <ConfirmButton content={"Đồng ý"} />
                        </Popconfirm>
                        <CancelButton
                          content={"Từ chối"}
                          onClick={() => showRejectModal(group)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
                <Pagination
                  current={currentPagePendingGroups}
                  pageSize={pageSize}
                  total={pendingGroups.length}
                  onChange={(page) => setCurrentPagePendingGroups(page)}
                  style={{ textAlign: "center", marginTop: "20px" }}
                />
              </div>
            </Tabs.TabPane>
          </Tabs>
        </Col>
        <Col xs={24} md={18}>
          <Row
            gutter={[8, 16]}
            style={{
              backgroundColor: "#f0f2f5",
              borderRadius: "8px",
            }}
          >
            <Col xs={24} md={8}>
              <Card
                title="Lịch họp của nhóm"
                headStyle={{
                  color: "#000",
                  fontWeight: "bold",
                  textAlign: "center",
                  fontSize: "18px",
                }}
                bodyStyle={{
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
                extra={
                  <Tooltip title="Thêm cuộc hẹn mới">
                    <PlusOutlined
                      onClick={() => HandleOpenAddModal()}
                      style={{
                        fontSize: "1.4rem",
                        color: "#1890FF",
                        cursor: "pointer",
                      }}
                    />
                  </Tooltip>
                }
                style={{
                  padding: "16px",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  marginBottom: "16px",
                }}
              >
                {selectedGroup?.matchedDetails?.time.length > 0 ? (
                  selectedGroup.matchedDetails.time.map((meet, index) => (
                    <Card.Grid
                      key={index}
                      style={{
                        marginBottom: "10px",
                        backgroundColor: "#E6F7FF",
                        padding: "10px",
                        borderRadius: "5px",
                        width: "100%",
                      }}
                    >
                      <Row>
                        <Col span={20} style={{ lineHeight: "1.5rem" }}>
                          <p className="remove-default-style-p">
                            <strong>
                              <FaThumbtack
                                style={{ color: "red", marginRight: "5px" }}
                              />
                              Buổi {index + 1}:
                            </strong>{" "}
                            {format(
                              new Date(meet.start),
                              "EEEE, dd'-'MM'-'yyyy",
                              {
                                locale: vi,
                              }
                            )}
                          </p>
                          <p className="remove-default-style-p">
                            <strong>
                              <FaClock style={{ marginRight: "5px" }} />
                              Thời gian:
                            </strong>{" "}
                            {format(new Date(meet.start), "HH:mm", {
                              locale: vi,
                            })}{" "}
                            -{" "}
                            {format(new Date(meet.end), "HH:mm", {
                              locale: vi,
                            })}
                          </p>
                          <p className="remove-default-style-p">
                            <strong>
                              <BiDetail
                                style={{
                                  color: "#00BFFF",
                                  marginRight: "5px",
                                  fontSize: "1.1rem",
                                }}
                              />
                              Nội dung cuộc họp:
                            </strong>{" "}
                            {meet.title}
                          </p>
                        </Col>
                        <Col
                          span={4}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Tooltip title="Chỉnh sửa">
                            <TiEdit
                              style={{
                                color: "#1890FF",
                                fontSize: "2rem",
                                cursor: "pointer",
                              }}
                            />
                          </Tooltip>
                        </Col>
                      </Row>
                    </Card.Grid>
                  ))
                ) : (
                  <Empty description="Chưa có lịch hãy vào lịch của các nhóm để tạo" />
                )}
              </Card>
            </Col>
            <Col xs={24} md={16}>
              {selectedGroup ? (
                <div
                  style={{
                    padding: "0px 0px",
                    backgroundColor: "#f0f2f5",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <h4
                      style={{
                        padding: "16px",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#333",
                      }}
                    >
                      Thông tin nhóm
                    </h4>

                    <Descriptions
                      bordered
                      column={1}
                      labelStyle={{ fontWeight: "bold", color: "#444" }}
                      contentStyle={{ color: "#555" }}
                    >
                      {/* Project Name */}
                      <Descriptions.Item label="Dự án">
                        <span
                          style={{
                            fontSize: "20px", // Larger font for emphasis
                            fontWeight: "bold",
                            color: "#1890ff", // Primary color for standout effect
                          }}
                        >
                          {selectedGroup.project?.name || "Chưa cập nhật"}
                        </span>
                      </Descriptions.Item>

                      {/* Project Description */}
                      <Descriptions.Item label="Mô tả dự án">
                        {selectedGroup.project?.description
                          ?.split("\n")
                          .map((line, index) => (
                            <p
                              key={index}
                              style={{ margin: 0, lineHeight: "1.6" }}
                            >
                              {line}
                            </p>
                          )) || "Không có thông tin"}
                      </Descriptions.Item>

                      {/* Combined Profession and Specialty as Tags */}
                      <Descriptions.Item label="Lĩnh vực & Chuyên môn">
                        {selectedGroup.projectCategory?.profession.length > 0 ||
                        selectedGroup.projectCategory?.specialties.length >
                          0 ? (
                          <>
                            {selectedGroup.projectCategory.profession.map(
                              (profession) => (
                                <Tag
                                  key={`profession-${profession._id}`}
                                  color="blue"
                                  style={{ marginBottom: "4px" }}
                                >
                                  {profession.name}
                                </Tag>
                              )
                            )}
                            {selectedGroup.projectCategory.specialties.map(
                              (specialty) => (
                                <Tag
                                  key={`specialty-${specialty._id}`}
                                  color="green"
                                  style={{ marginBottom: "4px" }}
                                >
                                  {specialty.name}
                                </Tag>
                              )
                            )}
                          </>
                        ) : (
                          "Chưa cập nhật"
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Lớp">
                        {selectedGroup.class?.className || "Chưa xác định"} -{" "}
                        {selectedGroup.group?.name || "Chưa xác định"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Giáo viên phụ trách">
                        <p
                          className="remove-default-style-p"
                          style={{ fontWeight: "500" }}
                        >
                          {selectedGroup.teacher?.username || "Chưa xác định"}
                        </p>
                        <p className="remove-default-style-p">
                          {selectedGroup.teacher?.email || "Chưa xác định"}
                        </p>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                  <h5 style={{ marginTop: "20px" }}>
                    Số lượng thành viên: {selectedGroup.members.length}
                  </h5>
                  <Row gutter={[12, 12]} style={{ marginTop: "10px" }}>
                    {selectedGroup.members.map((member, index) => (
                      <Col key={index} xs={24} sm={12} lg={6} xl={6}>
                        <div
                          className="custom-member-list-item"
                          onClick={() => showMemberDetails(member)}
                        >
                          <Avatar
                            size={40}
                            style={{
                              backgroundColor: member.isLeader
                                ? "#87d068"
                                : "#1890ff",
                              marginBottom: "6px",
                            }}
                          >
                            {member.username
                              .split(" ")
                              .slice(-1)[0]
                              .charAt(0)
                              .toUpperCase()}
                          </Avatar>
                          <div className="custom-member-info">
                            <p className="custom-member-name">
                              {member.username}
                              {member.isLeader && (
                                <Tooltip title="Nhóm trưởng">
                                  <StarFilled
                                    style={{
                                      color: "#FFD700",
                                      marginLeft: "6px",
                                      fontSize:
                                        "14px" /* Slightly smaller star */,
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </p>
                            <p className="custom-member-email">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>

                  <Drawer
                    title="Thông tin sinh viên"
                    placement="right"
                    onClose={closeDrawer}
                    open={isDrawerVisible}
                    width={400}
                    headerStyle={{ borderBottom: "none" }}
                    bodyStyle={{ padding: 0 }}
                    className="custom-member-drawer"
                  >
                    {selectedMember && (
                      <div className="custom-drawer-profile">
                        <div className="custom-drawer-info">
                          <p>
                            <strong>Họ và Tên:</strong>{" "}
                            {selectedMember.username}
                          </p>
                          <p>
                            <strong>Email:</strong> {selectedMember.email}
                          </p>
                          <p>
                            <strong>Mã sinh viên:</strong>{" "}
                            {selectedMember.rollNumber}
                          </p>
                          <p>
                            <strong>Chuyên ngành:</strong>{" "}
                            {selectedMember.major}
                          </p>
                          <p>
                            <strong>Vai trò:</strong>{" "}
                            {selectedMember.isLeader
                              ? "Nhóm trưởng"
                              : "Thành viên"}
                          </p>
                        </div>
                      </div>
                    )}
                  </Drawer>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <p>Vui lòng chọn một nhóm để xem chi tiết.</p>
                </div>
              )}
            </Col>
          </Row>
        </Col>
      </Row>
      <Modal
        title="Từ chối nhóm"
        open={isRejectModalVisible}
        onCancel={() => setIsRejectModalVisible(false)}
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "end" }}>
            <CancelButton
              content={"Hủy bỏ"}
              key="back"
              onClick={() => setIsRejectModalVisible(false)}
            />
            <ConfirmButton
              key="submit"
              type="primary"
              disabled={!declineMessage.trim()}
              onClick={handleReject}
              content="Gửi"
            />
          </div>
        }
      >
        <Input.TextArea
          rows={4}
          placeholder="Vui lòng nhập lý do từ chối..."
          value={declineMessage}
          onChange={(e) => setDeclineMessage(e.target.value)}
          required
        />
      </Modal>
    </div>
  );
};

export default GroupList;
