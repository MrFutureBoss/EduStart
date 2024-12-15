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
  Drawer,
  Tag,
  Popconfirm,
  message,
  Modal,
  Input,
  Badge,
  Form,
  Button,
  List,
  Typography,
  Alert,
  Select,
} from "antd";
import {
  CalendarOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  StarFilled,
} from "@ant-design/icons";
import { FaExclamationCircle } from "react-icons/fa";
import { MdGroup } from "react-icons/md";
import { BASE_URL } from "../../../utilities/initalValue";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMatchedGroups } from "../../../redux/slice/MatchedGroupSlice";
import "../../../style/Mentor/GroupList.css";
import CancelButton from "../../../components/Button/CancelButton";
import ConfirmButton from "../../../components/Button/ConfirmButton";
import CreateMeetingDay from "./CreateMeetingDay";
import CustomCalendar from "./MeetingSchedule";
import moment from "moment";
import TextArea from "antd/es/input/TextArea";
import runes from "runes2";
import { useLocation } from "react-router-dom";
const { Option } = Select;
const { Text } = Typography;
const { Search } = Input;

const GroupList = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [declineMessage, setDeclineMessage] = useState("");
  const [selectedGroupToReject, setSelectedGroupToReject] = useState(null);
  const [currentPageMyGroups, setCurrentPageMyGroups] = useState(1);
  const [currentPagePendingGroups, setCurrentPagePendingGroups] = useState(1);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;
  const [currentMemberPage, setCurrentMemberPage] = useState(1);
  const pageMemberSize = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const [groupFilterKey, setGroupFilterKey] = useState("all");

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
        console.log("matched", groupResponse.data);

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

  const [activeTab, setActiveTab] = useState("allGroups");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filteredMembers, setFilteredMembers] = useState([]);

  useEffect(() => {
    if (selectedGroup && selectedGroup.members) {
      updateFilteredMembers(selectedGroup.members, searchTerm);
    }
  }, [selectedGroup, searchTerm]);

  const updateFilteredMembers = (members, search) => {
    let sortedMembers = [...members].sort((a, b) => {
      if (a.isLeader && !b.isLeader) return -1;
      if (!a.isLeader && b.isLeader) return 1;
      return 0;
    });

    if (search) {
      const filteredData = sortedMembers.filter(
        (member) =>
          member.username.toLowerCase().includes(search.toLowerCase()) ||
          member.email.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredMembers(filteredData);
    } else {
      setFilteredMembers(sortedMembers);
    }
    setCurrentMemberPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const myGroups = useMemo(() => {
    return groups
      .filter((group) => group.matchedDetails.status === "Accepted")
      .sort((a, b) => {
        const timeA = a.matchedDetails.time;
        const timeB = b.matchedDetails.time;

        // Nhóm không có time hoặc time rỗng sẽ được ưu tiên xếp trước
        if ((!timeA || timeA.length === 0) && (!timeB || timeB.length === 0)) {
          return 0;
        }
        if (!timeA || timeA.length === 0) {
          return -1;
        }
        if (!timeB || timeB.length === 0) {
          return 1;
        }
        return 0;
      });
  }, [groups]);

  const pendingGroups = useMemo(
    () => groups.filter((group) => group.matchedDetails.status === "Pending"),
    [groups]
  );

  const allGroups = useMemo(
    () => [...myGroups, ...pendingGroups],
    [myGroups, pendingGroups]
  );

  const startIndex = (currentPage - 1) * pageSize;
  const currentGroups = allGroups.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam === "pending") {
      setActiveTab(tabParam);
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === "allGroups" && allGroups.length > 0) {
      setSelectedGroup(allGroups[0]);
    } else if (activeTab === "myGroups" && myGroups.length > 0) {
      setSelectedGroup(myGroups[0]);
    } else if (activeTab === "pending" && pendingGroups.length > 0) {
      setSelectedGroup(pendingGroups[0]);
    }
  }, [activeTab, allGroups, myGroups, pendingGroups]);

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

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getNextMeetingTime = (meetings) => {
    const now = moment();

    // Lọc các cuộc họp gần thời gian hiện tại
    const upcomingMeetings = meetings.filter((meeting) =>
      moment(meeting.start).isAfter(now)
    );

    upcomingMeetings.sort((a, b) => moment(a.start) - moment(b.start));

    if (upcomingMeetings.length > 0) {
      const nextMeeting = upcomingMeetings[0];
      const formattedDate = capitalizeFirstLetter(
        moment(nextMeeting.start).format("dddd, DD-MM-YYYY")
      );
      const formattedTimeStart = moment(nextMeeting.start).format("HH:mm");
      const formattedTimeEnd = moment(nextMeeting.end).format("HH:mm");

      return `${formattedDate} (${formattedTimeStart} - ${formattedTimeEnd})`;
    }

    return "Không có cuộc họp nào sắp tới";
  };

  const filteredMyGroups = useMemo(() => {
    if (groupFilterKey === "noMeeting") {
      return myGroups.filter(
        (group) =>
          !group.matchedDetails.time || group.matchedDetails.time.length === 0
      );
    } else if (groupFilterKey === "hasMeeting") {
      return myGroups.filter(
        (group) =>
          group.matchedDetails.time && group.matchedDetails.time.length > 0
      );
    }
    return myGroups;
  }, [myGroups, groupFilterKey]);

  const paginatedFilteredMyGroups = useMemo(() => {
    const start = (currentPageMyGroups - 1) * pageSize;
    return filteredMyGroups.slice(start, start + pageSize);
  }, [filteredMyGroups, currentPageMyGroups]);

  const handleApprove = async (matchedDetailsId) => {
    setLoading(true);
    try {
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
        {
          status: "Rejected",
          declineMessage,
          updatedAt: moment().toISOString(),
        },
        config
      );

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

  const HandleOpenAddModal = (groupKey) => {
    setIsAddModalOpen(true);
    setGroupId(groupKey);
    form.setFieldsValue({
      meetingContent: "",
      meetingDate: null,
      meetingStartTime: null,
      meetingDuration: 90,
    });
  };

  const HandleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setGroupId("");
  };

  const HandleViewGroupDetail = () => {
    setIsDetailOpen(true);
  };

  const HandleViewGroupSchedule = () => {
    setIsDetailOpen(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const [filterStatus, setFilterStatus] = useState("all");

  // Hàm thay đổi trạng thái bộ lọc
  const handleFilterChange = (value) => {
    setFilterStatus(value);
  };

  const filteredGroups = useMemo(() => {
    if (filterStatus === "noMeeting") {
      // Nhóm đã duyệt nhưng không có lịch họp sắp tới
      return allGroups.filter((group) => {
        if (group.matchedDetails.status !== "Accepted") return false;

        // Kiểm tra nếu nhóm không có time hoặc time rỗng
        if (
          !group.matchedDetails.time ||
          group.matchedDetails.time.length === 0
        )
          return true;

        // Kiểm tra nếu tất cả thời gian trong time đều đã qua
        const now = moment();
        const hasFutureMeeting = group.matchedDetails.time.some((meeting) =>
          moment(meeting.start).isAfter(now)
        );
        return !hasFutureMeeting;
      });
    } else if (filterStatus === "hasMeeting") {
      // Nhóm đã duyệt và có ít nhất một lịch họp trong tương lai
      return allGroups.filter(
        (group) =>
          group.matchedDetails.status === "Accepted" &&
          group.matchedDetails.time &&
          group.matchedDetails.time.some((meeting) =>
            moment(meeting.start).isAfter(moment())
          )
      );
    } else if (filterStatus === "pending") {
      // Nhóm chờ duyệt
      return allGroups.filter(
        (group) => group.matchedDetails.status === "Pending"
      );
    }
    // Hiển thị tất cả nhóm nếu không lọc
    return allGroups;
  }, [filterStatus, allGroups]);

  return (
    <div className="zoom-better">
      <CreateMeetingDay
        groupId={groupId}
        open={isAddModalOpen}
        close={HandleCloseAddModal}
      />
      <Row gutter={[8, 16]}>
        <Col
          xs={24}
          md={24}
          lg={6}
          style={{
            backgroundColor: "#F0F2F5",
          }}
        >
          <Card
            title={
              <h5
                style={{
                  fontSize: "18px",
                  padding: "16px",
                  margin: "0",
                  color: "#FFF",
                  fontWeight: "bold",
                  width: "fit-content",
                }}
              >
                Thông tin chung các nhóm
              </h5>
            }
            headStyle={{
              backgroundColor: "rgb(96, 178, 199)",
              padding: "0",
            }}
            bodyStyle={{
              padding: "0px 1rem",
              backgroundColor: "#f5f5f5",
            }}
            style={{
              marginBottom: "1rem",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <Row
              align="middle"
              style={{
                padding: "12px 0",
                display: pendingGroups === 0 ? "none" : "",
                borderBottom: "1px solid #e8e8e8",
              }}
            >
              <Col span={16} style={{ textAlign: "start", fontWeight: "bold" }}>
                Nhóm mới do giảng viên đề cử:
              </Col>
              <Col
                span={8}
                style={{
                  textAlign: "end",
                  color: "rgb(255, 77, 79)",
                  fontWeight: "bold",
                }}
              >
                {pendingGroups.length} nhóm
                <FaExclamationCircle className="new-icon" />
              </Col>
            </Row>
            <Row
              align="middle"
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #e8e8e8",
              }}
            >
              <Col span={16} style={{ textAlign: "start", fontWeight: "bold" }}>
                Nhóm của bạn:
              </Col>
              <Col
                span={8}
                style={{
                  textAlign: "end",
                  color: "rgb(24, 144, 255)",
                  fontWeight: "bold",
                }}
              >
                {myGroups.length} nhóm
                <MdGroup className="supported-icon" />
              </Col>
            </Row>
            <Row
              align="middle"
              style={{
                padding: "12px 0",
                display: pendingGroups === 0 ? "none" : "",
                borderBottom: "1px solid #e8e8e8",
              }}
            >
              <Col span={24} style={{ textAlign: "start", fontWeight: "bold" }}>
                <span style={{ marginTop: "8px", fontWeight: "500" }}>
                  {(() => {
                    const now = moment();
                    const upcomingMeetings = myGroups
                      .flatMap((group) =>
                        (group.matchedDetails?.time || []).map((meeting) => ({
                          ...meeting,
                          groupName: `Lớp ${group.class.className} - ${group.group.name}`,
                        }))
                      )
                      .filter((meeting) => moment(meeting.start).isAfter(now))
                      .sort((a, b) => moment(a.start) - moment(b.start));

                    if (upcomingMeetings.length > 0) {
                      const nextMeeting = upcomingMeetings[0];
                      const formattedDate = capitalizeFirstLetter(
                        moment(nextMeeting.start).format("dddd, DD-MM-YYYY")
                      );
                      const formattedTimeStart = moment(
                        nextMeeting.start
                      ).format("HH:mm");
                      const formattedTimeEnd = moment(nextMeeting.end).format(
                        "HH:mm"
                      );

                      return (
                        <div>
                          Buổi họp sắp tới:&nbsp;
                          <span
                            style={{
                              color: "rgb(0, 0, 0)",
                              fontWeight: "500",
                            }}
                          >
                            {nextMeeting.groupName}
                          </span>
                          <div
                            style={{
                              color: "#008315",
                              marginTop: "4px",
                            }}
                          >
                            {formattedDate} ({formattedTimeStart} -{" "}
                            {formattedTimeEnd})
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div style={{ color: "rgb(255, 77, 79)" }}>
                        Không có buổi họp nào sắp tới
                      </div>
                    );
                  })()}
                </span>
              </Col>
            </Row>
          </Card>

          {pendingGroups.length > 0 ? (
            <Tabs
              type="card"
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              defaultActiveKey="allGroups"
              style={{ marginBottom: "20px" }}
            >
              <Tabs.TabPane
                key="allGroups"
                tab={
                  <Tooltip
                    title={
                      allGroups.length === 0
                        ? "Hiện tại không có nhóm nào"
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
                      <span>Tất cả</span>
                    </div>
                  </Tooltip>
                }
              >
                <Row gutter={[8, 16]} style={{ marginBottom: "16px" }}>
                  <Col span={8}>
                    <Select
                      defaultValue="all"
                      onChange={handleFilterChange}
                      style={{ width: "10rem" }}
                    >
                      <Option value="all">Tất cả nhóm</Option>
                      <Option value="noMeeting">Chưa có lịch họp</Option>
                      <Option value="hasMeeting">Có lịch họp</Option>
                      <Option value="pending">Nhóm chờ duyệt</Option>
                    </Select>
                  </Col>
                </Row>
                {filteredGroups.map((group, index) => {
                  // Card cho nhóm "Nhóm của bạn"
                  if (myGroups.includes(group)) {
                    return (
                      <Card
                        key={`myGroup-${index}`}
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
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <h4 style={{ margin: "0px", fontSize: "1.1rem" }}>
                              Lớp {group.class.className} - {group.group.name}
                            </h4>
                            {isDetailOpen ? (
                              <Tooltip title="Xem lịch họp">
                                <Button
                                  color="primary"
                                  variant="solid"
                                  onClick={() => {
                                    HandleViewGroupSchedule();
                                  }}
                                >
                                  <CalendarOutlined />
                                </Button>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Xem chi tiết nhóm">
                                <Button
                                  color="primary"
                                  variant="solid"
                                  onClick={() => HandleViewGroupDetail()}
                                >
                                  <InfoCircleOutlined />
                                </Button>
                              </Tooltip>
                            )}
                          </div>
                          <p
                            style={{ marginBottom: "4px", fontSize: "0.8rem" }}
                          >
                            Dự án {group.project.name}
                          </p>
                          <p
                            style={{ marginBottom: "4px", fontSize: "0.8rem" }}
                          >
                            Thể loại dự án:{" "}
                            {group.projectCategory?.profession.map(
                              (profession) => (
                                <Tag
                                  key={`profession-${profession._id}`}
                                  color="#62B6CB"
                                >
                                  <Tooltip title="Lĩnh vực">
                                    {profession.name}
                                  </Tooltip>
                                </Tag>
                              )
                            )}
                          </p>
                          {group.matchedDetails.time &&
                          group.matchedDetails.time.length > 0 ? (
                            getNextMeetingTime(group.matchedDetails.time) !==
                            "Không có cuộc họp nào sắp tới" ? (
                              <p
                                className="remove-default-style-p"
                                style={{
                                  fontWeight: "500",
                                  fontSize: "0.8rem",
                                  marginBottom: "0.4rem",
                                  color: "green",
                                }}
                              >
                                Cuộc họp sắp tới:{" "}
                                {getNextMeetingTime(group.matchedDetails.time)}
                              </p>
                            ) : (
                              <p
                                className="remove-default-style-p"
                                style={{
                                  fontWeight: "500",
                                  fontSize: "0.8rem",
                                  marginBottom: "0.4rem",
                                  color: "red",
                                }}
                              >
                                Nhóm chưa có buổi họp tiếp theo
                              </p>
                            )
                          ) : (
                            <p
                              className="remove-default-style-p"
                              style={{
                                fontWeight: "500",
                                fontSize: "0.8rem",
                                marginBottom: "0.4rem",
                                color: "red",
                              }}
                            >
                              Nhóm chưa có lịch họp
                            </p>
                          )}
                        </div>
                      </Card>
                    );
                  }

                  // Card cho nhóm "Nhóm chờ duyệt"
                  if (pendingGroups.includes(group)) {
                    const updatedAt = moment(group.matchedDetails?.updatedAt);
                    const now = moment();
                    const hoursRemaining = 48 - now.diff(updatedAt, "hours");
                    const daysRemaining = Math.floor(hoursRemaining / 24);
                    const remainingHours = hoursRemaining % 24;
                    const isTimeUp = hoursRemaining <= 0;

                    return (
                      <Card
                        key={`pendingGroup-${index}`}
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
                            Lớp {group.class.className} - {group.group.name}
                          </h4>
                          <p style={{ marginBottom: "4px" }}>
                            Dự án {group.project.name}
                          </p>
                          <p>
                            Thể loại dự án:{" "}
                            {group.projectCategory?.profession.map(
                              (profession) => (
                                <Tag
                                  key={`profession-${profession._id}`}
                                  color="#62B6CB"
                                >
                                  <Tooltip title="Lĩnh vực">
                                    {profession.name}
                                  </Tooltip>
                                </Tag>
                              )
                            )}
                          </p>
                          <p
                            className="remove-default-style-p"
                            style={{
                              fontWeight: "500",
                              fontSize: "0.7rem",
                              marginBottom: "0.4rem",
                              color: "red",
                              fontStyle: "italic",
                            }}
                          >
                            Giảng viên {group.teacher?.email} muốn bạn hỗ trợ
                            nhóm này
                          </p>
                          <p
                            className="remove-default-style-p"
                            style={{
                              fontWeight: "500",
                              fontSize: "0.7rem",
                              marginBottom: "0.4rem",
                              color: "red",
                              lineHeight: "0.7rem",
                            }}
                          >
                            {hoursRemaining > 0
                              ? `Thời gian phản hồi: Còn ${
                                  daysRemaining > 0
                                    ? `${daysRemaining} ngày`
                                    : ""
                                } ${
                                  remainingHours > 0
                                    ? `${remainingHours} giờ`
                                    : ""
                                }`
                              : "Hết thời gian phản hồi"}
                          </p>
                          {!isTimeUp && (
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
                          )}
                        </div>
                      </Card>
                    );
                  }

                  return null;
                })}
                {/* Pagination */}
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={allGroups.length}
                  onChange={handlePageChange}
                  style={{ textAlign: "center", marginTop: "20px" }}
                  hideOnSinglePage
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
                      <span>Nhóm chờ duyệt</span>
                      <Badge count={pendingGroups.length} />
                    </div>
                  </Tooltip>
                }
              >
                <div>
                  {paginatedPendingGroups.map((group, index) => {
                    const updatedAt = moment(group.matchedDetails?.updatedAt);
                    const now = moment();
                    const hoursRemaining = 48 - now.diff(updatedAt, "hours");
                    const daysRemaining = Math.floor(hoursRemaining / 24);
                    const remainingHours = hoursRemaining % 24;
                    const isTimeUp = hoursRemaining <= 0;

                    return (
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
                            Lớp {group.class.className} - {group.group.name}
                          </h4>
                          <p style={{ marginBottom: "4px" }}>
                            Dự án {group.project.name}
                          </p>
                          <p>
                            Thể loại dự án:
                            {group.projectCategory?.profession.map(
                              (profession) => (
                                <Tag
                                  key={`profession-${profession._id}`}
                                  color="#62B6CB"
                                >
                                  <Tooltip title="Lĩnh vực">
                                    {profession.name}
                                  </Tooltip>
                                </Tag>
                              )
                            )}
                          </p>
                          <p
                            className="remove-default-style-p"
                            style={{
                              fontWeight: "500",
                              fontSize: "0.7rem",
                              marginBottom: "0.4rem",
                              color: "red",
                              fontStyle: "italic",
                            }}
                          >
                            Giảng viên {group.teacher?.email} muốn bạn hỗ trợ
                            nhóm này
                          </p>
                          <p
                            className="remove-default-style-p"
                            style={{
                              fontWeight: "500",
                              fontSize: "0.7rem",
                              marginBottom: "0.4rem",
                              color: "red",
                            }}
                          >
                            {hoursRemaining > 0
                              ? `Thời gian phản hồi: Còn ${
                                  daysRemaining > 0
                                    ? `${daysRemaining} ngày`
                                    : ""
                                } ${
                                  remainingHours > 0
                                    ? `${remainingHours} giờ`
                                    : ""
                                }`
                              : "Hết thời gian phản hồi"}
                          </p>
                          {!isTimeUp && (
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
                          )}
                        </div>
                      </Card>
                    );
                  })}
                  <Pagination
                    current={currentPagePendingGroups}
                    pageSize={pageSize}
                    total={pendingGroups.length}
                    onChange={(page) => setCurrentPagePendingGroups(page)}
                    style={{ textAlign: "center", marginTop: "20px" }}
                    hideOnSinglePage
                  />
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane
                key="myGroups"
                tab={
                  <Tooltip
                    title={
                      myGroups.length === 0
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
                      <span>Nhóm của bạn</span>
                    </div>
                  </Tooltip>
                }
              >
                {myGroups.filter(
                  (group) =>
                    !group.matchedDetails.time ||
                    group.matchedDetails.time.length === 0
                ).length !== 0 ? (
                  // <AntTabs
                  //   defaultActiveKey="all"
                  //   onChange={(key) => setGroupFilterKey(key)}
                  //   style={{ marginBottom: "20px" }}
                  // >
                  //   <AntTabs.TabPane
                  //     key="all"
                  //     tab={
                  //       <div
                  //         style={{
                  //           display: "flex",
                  //           alignItems: "center",
                  //           gap: "8px",
                  //         }}
                  //       >
                  //         <span>Tất cả</span>
                  //         <Badge count={myGroups.length} />
                  //       </div>
                  //     }
                  //   />
                  //   <AntTabs.TabPane
                  //     key="hasMeeting"
                  //     disabled={
                  //       myGroups.filter(
                  //         (group) =>
                  //           group.matchedDetails.time &&
                  //           group.matchedDetails.time.length > 0
                  //       ).length === 0
                  //     }
                  //     tab={
                  //       <div
                  //         style={{
                  //           display: "flex",
                  //           alignItems: "center",
                  //           gap: "8px",
                  //         }}
                  //       >
                  //         <span>Đã có lịch họp</span>
                  //         <Badge
                  //           count={
                  //             myGroups.filter(
                  //               (group) =>
                  //                 group.matchedDetails.time &&
                  //                 group.matchedDetails.time.length > 0
                  //             ).length
                  //           }
                  //         />
                  //       </div>
                  //     }
                  //   />
                  //   <AntTabs.TabPane
                  //     key="noMeeting"
                  //     disabled={
                  //       myGroups.filter(
                  //         (group) =>
                  //           !group.matchedDetails.time ||
                  //           group.matchedDetails.time.length === 0
                  //       ).length === 0
                  //     }
                  //     tab={
                  //       <div
                  //         style={{
                  //           display: "flex",
                  //           alignItems: "center",
                  //           gap: "8px",
                  //         }}
                  //       >
                  //         <span>Chưa có lịch họp</span>
                  //         <Badge
                  //           count={
                  //             myGroups.filter(
                  //               (group) =>
                  //                 !group.matchedDetails.time ||
                  //                 group.matchedDetails.time.length === 0
                  //             ).length
                  //           }
                  //         />
                  //       </div>
                  //     }
                  //   />
                  // </AntTabs>
                  <></>
                ) : (
                  <></>
                )}
                {paginatedFilteredMyGroups.map((group, index) => (
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <h4 style={{ margin: "0px", fontSize: "1.1rem" }}>
                          Lớp {group.class.className} - {group.group.name}
                        </h4>
                        {isDetailOpen ? (
                          <Tooltip title="Xem lịch họp">
                            <Button
                              color="primary"
                              variant="solid"
                              onClick={() => {
                                HandleViewGroupSchedule();
                              }}
                            >
                              <CalendarOutlined />
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Xem chi tiết nhóm">
                            <Button
                              color="primary"
                              variant="solid"
                              onClick={() => HandleViewGroupDetail()}
                            >
                              <InfoCircleOutlined />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                      <p style={{ marginBottom: "4px", fontSize: "0.8rem" }}>
                        Dự án {group.project.name}
                      </p>
                      <p style={{ marginBottom: "4px", fontSize: "0.8rem" }}>
                        Thể loại dự án:{" "}
                        {group.projectCategory?.profession.map((profession) => (
                          <Tag
                            key={`profession-${profession._id}`}
                            color="#62B6CB"
                          >
                            <Tooltip title="Lĩnh vực">
                              {profession.name}
                            </Tooltip>
                          </Tag>
                        ))}
                      </p>
                      {group.matchedDetails.time &&
                      group.matchedDetails.time.length > 0 ? (
                        getNextMeetingTime(group.matchedDetails.time) !==
                        "Không có cuộc họp nào sắp tới" ? (
                          <p
                            className="remove-default-style-p"
                            style={{
                              fontWeight: "500",
                              fontSize: "0.8rem",
                              marginBottom: "0.4rem",
                              color: "green",
                            }}
                          >
                            Cuộc họp sắp tới:{" "}
                            {getNextMeetingTime(group.matchedDetails.time)}
                          </p>
                        ) : (
                          <p
                            className="remove-default-style-p"
                            style={{
                              fontWeight: "500",
                              fontSize: "0.8rem",
                              marginBottom: "0.4rem",
                              color: "red",
                            }}
                          >
                            Nhóm chưa có buổi họp tiếp theo
                          </p>
                        )
                      ) : (
                        <p
                          className="remove-default-style-p"
                          style={{
                            fontWeight: "500",
                            fontSize: "0.8rem",
                            marginBottom: "0.4rem",
                            color: "red",
                          }}
                        >
                          Nhóm chưa có lịch họp
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
                <Pagination
                  current={currentPageMyGroups}
                  pageSize={pageSize}
                  total={filteredMyGroups.length}
                  onChange={(page) => setCurrentPageMyGroups(page)}
                  style={{ textAlign: "center", marginTop: "20px" }}
                  hideOnSinglePage
                />
              </Tabs.TabPane>
            </Tabs>
          ) : (
            <>
              <h5>Bạn có tất cả {allGroups.length} nhóm</h5>
              {isDetailOpen ? (
                <Button
                  color="primary"
                  variant="solid"
                  onClick={() => {
                    HandleViewGroupSchedule();
                  }}
                >
                  <CalendarOutlined /> Xem lịch họp nhóm
                </Button>
              ) : (
                <Button
                  color="primary"
                  variant="solid"
                  onClick={() => HandleViewGroupDetail()}
                >
                  <InfoCircleOutlined />
                  Xem thông tin nhóm
                </Button>
              )}
              {currentGroups.map((group, index) => {
                // Card cho nhóm "Nhóm của bạn"
                if (myGroups.includes(group)) {
                  return (
                    <Card
                      key={`myGroup-${index}`}
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
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <h4 style={{ margin: "0px", fontSize: "1.1rem" }}>
                            Lớp {group.class.className} - {group.group.name}
                          </h4>
                        </div>
                        <p style={{ marginBottom: "4px", fontSize: "0.8rem" }}>
                          Dự án {group.project.name}
                        </p>
                        <p style={{ marginBottom: "4px", fontSize: "0.8rem" }}>
                          Thể loại dự án:{" "}
                          {group.projectCategory?.profession.map(
                            (profession) => (
                              <Tag
                                key={`profession-${profession._id}`}
                                color="#62B6CB"
                              >
                                <Tooltip title="Lĩnh vực">
                                  {profession.name}
                                </Tooltip>
                              </Tag>
                            )
                          )}
                        </p>
                        {group.matchedDetails.time &&
                        group.matchedDetails.time.length > 0 ? (
                          getNextMeetingTime(group.matchedDetails.time) !==
                          "Không có cuộc họp nào sắp tới" ? (
                            <p
                              className="remove-default-style-p"
                              style={{
                                fontWeight: "500",
                                fontSize: "0.8rem",
                                marginBottom: "0.4rem",
                                color: "green",
                              }}
                            >
                              Cuộc họp sắp tới:{" "}
                              {getNextMeetingTime(group.matchedDetails.time)}
                            </p>
                          ) : (
                            <p
                              className="remove-default-style-p"
                              style={{
                                fontWeight: "500",
                                fontSize: "0.8rem",
                                marginBottom: "0.4rem",
                                color: "red",
                              }}
                            >
                              Nhóm chưa có buổi họp tiếp theo
                            </p>
                          )
                        ) : (
                          <p
                            className="remove-default-style-p"
                            style={{
                              fontWeight: "500",
                              fontSize: "0.8rem",
                              marginBottom: "0.4rem",
                              color: "red",
                            }}
                          >
                            Nhóm chưa có lịch họp
                          </p>
                        )}
                      </div>
                    </Card>
                  );
                }

                // Card cho nhóm "Nhóm chờ duyệt"
                if (pendingGroups.includes(group)) {
                  const updatedAt = moment(group.matchedDetails?.updatedAt);
                  const now = moment();
                  const hoursRemaining = 48 - now.diff(updatedAt, "hours");
                  const daysRemaining = Math.floor(hoursRemaining / 24);
                  const remainingHours = hoursRemaining % 24;
                  const isTimeUp = hoursRemaining <= 0;

                  return (
                    <Card
                      key={`pendingGroup-${index}`}
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
                          Lớp {group.class.className} - {group.group.name}
                        </h4>
                        <p style={{ marginBottom: "4px" }}>
                          Dự án {group.project.name}
                        </p>
                        <p>
                          Thể loại dự án:{" "}
                          {group.projectCategory?.profession.map(
                            (profession) => (
                              <Tag
                                key={`profession-${profession._id}`}
                                color="#62B6CB"
                              >
                                <Tooltip title="Lĩnh vực">
                                  {profession.name}
                                </Tooltip>
                              </Tag>
                            )
                          )}
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
                          {hoursRemaining > 0
                            ? `Thời gian phản hồi: Còn ${
                                daysRemaining > 0 ? `${daysRemaining} ngày` : ""
                              } ${
                                remainingHours > 0
                                  ? `${remainingHours} giờ`
                                  : ""
                              }`
                            : "Hết thời gian phản hồi"}
                        </p>
                        {!isTimeUp && (
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
                        )}
                      </div>
                    </Card>
                  );
                }

                return null;
              })}
              {/* Pagination */}
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={allGroups.length}
                onChange={handlePageChange}
                style={{ textAlign: "center", marginTop: "20px" }}
                hideOnSinglePage
              />
            </>
          )}
        </Col>
        <Col xs={24} md={24} lg={18}>
          <Row
            gutter={[16, 16]}
            style={{
              backgroundColor: "#f0f2f5",
              borderRadius: "8px",
              marginTop: "1rem",
              display:
                isDetailOpen ||
                activeTab === "pending" ||
                selectedGroup?.matchedDetails?.status === "Pending"
                  ? "flex"
                  : "none",
            }}
          >
            <Col xs={24} md={24} lg={8}>
              {selectedGroup ? (
                <Card
                  title={
                    <h5
                      style={{
                        fontSize: "18px",
                        padding: "16px",
                        margin: "0",
                        color: "#FFF",
                        fontWeight: "bold",
                      }}
                    >
                      Thành viên nhóm{" "}
                      <small style={{ fontWeight: "400" }}>
                        ({selectedGroup.members.length} thành viên)
                      </small>
                    </h5>
                  }
                  headStyle={{
                    backgroundColor: "rgb(96, 178, 199)",
                    padding: "0",
                  }}
                  bodyStyle={{
                    padding: "0",
                  }}
                >
                  <div style={{ margin: "1rem 0px" }}>
                    <Search
                      placeholder="Tìm thành viên theo tên và email"
                      enterButton
                      onSearch={handleSearch}
                      style={{
                        width: "100%",
                        display:
                          selectedGroup.members.length === pageMemberSize
                            ? "none"
                            : "flex",
                      }}
                    />

                    <List
                      itemLayout="horizontal"
                      dataSource={filteredMembers.slice(
                        (currentMemberPage - 1) * pageMemberSize,
                        currentMemberPage * pageMemberSize
                      )}
                      renderItem={(member) => (
                        <List.Item
                          key={member._id}
                          onClick={() => showMemberDetails(member)}
                          className="group-members-list-item"
                          style={{
                            padding: "10px",
                            cursor: "pointer",
                          }}
                          actions={[
                            member.isLeader && (
                              <Tooltip title="Nhóm trưởng">
                                <StarFilled
                                  style={{
                                    color: "#FFD700",
                                    marginLeft: "6px",
                                    fontSize: "14px",
                                  }}
                                />
                              </Tooltip>
                            ),
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                size={40}
                                style={{
                                  backgroundColor: member.isLeader
                                    ? "#87d068"
                                    : "#60B2C7",
                                }}
                              >
                                {member.username
                                  .split(" ")
                                  .slice(-1)[0]
                                  .charAt(0)
                                  .toUpperCase()}
                              </Avatar>
                            }
                            title={<Text strong>{member.username}</Text>}
                            description={<i>{member.email}</i>}
                          />
                        </List.Item>
                      )}
                    />

                    <Pagination
                      current={currentMemberPage}
                      pageSize={pageMemberSize}
                      total={filteredMembers.length}
                      onChange={(page) => setCurrentMemberPage(page)}
                      style={{ textAlign: "center", marginTop: "16px" }}
                      hideOnSinglePage
                    />
                  </div>
                </Card>
              ) : (
                <Row>Chưa có thông tin</Row>
              )}
            </Col>
            <Col xs={24} md={24} lg={16}>
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
                        color: "#FFF",
                        backgroundColor: "rgb(96, 178, 199)",
                        borderRadius: "8px 8px 0px 0px",
                        marginBottom: 0,
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
          <Row
            gutter={[16, 16]}
            style={{
              backgroundColor: "#f0f2f5",
              borderRadius: "8px",
              display: !isDetailOpen
                ? activeTab === "pending" ||
                  selectedGroup?.matchedDetails?.status === "Pending"
                  ? "none"
                  : "flex"
                : "none",
            }}
          >
            <Col xs={24} md={24}>
              <Card
                title={
                  <h5
                    style={{
                      fontSize: "18px",
                      padding: "16px",
                      margin: "0",
                      color: "#FFF",
                      fontWeight: "bold",
                      width: "fit-content",
                    }}
                  >
                    Lịch họp các nhóm
                  </h5>
                }
                extra={
                  <Tooltip title="Thêm lịch họp mới">
                    <Button
                      style={{ marginRight: "20px", cursor: "pointer" }}
                      color="primary"
                      variant="solid"
                      onClick={() =>
                        HandleOpenAddModal(selectedGroup?.matchedDetails?._id)
                      }
                    >
                      <PlusOutlined
                        style={{
                          color: "#FFF",
                        }}
                      />
                      Thêm lịch họp mới
                    </Button>
                  </Tooltip>
                }
                headStyle={{
                  backgroundColor: "rgb(96, 178, 199)",
                  padding: "0",
                }}
                bodyStyle={{
                  padding: "0",
                }}
              >
                <CustomCalendar selectedEvent={selectedGroup?.matchedDetails} />
                <Alert
                  style={{ padding: "10px" }}
                  message="Thông tin cần chú ý"
                  description={
                    <div>
                      <p
                        className="remove-default-style-p"
                        style={{ marginBottom: "0.8rem" }}
                      >
                        Giải thích các thẻ màu:{" "}
                        <Tag color="#bdd8ee" style={{ color: "#000" }}>
                          Lịch họp với nhóm bạn chọn
                        </Tag>
                        <Tag color="#e4e0c2" style={{ color: "#000" }}>
                          Lịch họp với các nhóm khác
                        </Tag>
                        <Tag color="#808080" style={{ color: "#000" }}>
                          Lịch họp đã qua
                        </Tag>
                      </p>
                      <p style={{ fontWeight: "500", marginBottom: "0.8rem" }}>
                        Bấm vào ô trắng trước ngày hiện tại là tạo nhanh lịch
                        họp
                      </p>
                      <p style={{ fontWeight: "500" }}>
                        Bấm vào thẻ để xem chi tiết và chỉnh sửa cuộc họp
                      </p>
                    </div>
                  }
                  type="info"
                  showIcon
                  closable
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      <Modal
        title="Lí do từ chối nhóm"
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
        <TextArea
          style={{ marginBottom: "1.5rem" }}
          rows={4}
          count={{
            show: true,
            max: 50,
            strategy: (txt) => runes(txt).length,
            exceedFormatter: (txt, { max }) =>
              runes(txt).slice(0, max).join(""),
          }}
          placeholder="Vui lòng nhập lý do từ chối..."
          value={declineMessage}
          onChange={(e) => setDeclineMessage(e.target.value)}
          allowClear
          required
        />
      </Modal>
    </div>
  );
};

export default GroupList;
