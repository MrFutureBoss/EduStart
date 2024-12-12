import React, { useEffect, useState } from "react";
import {
  Card,
  List,
  Avatar,
  Typography,
  Button,
  Badge,
  message,
  Tag,
  Row,
  Col,
  Empty,
} from "antd";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { StarOutlined, SettingOutlined } from "@ant-design/icons";
import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "../../utilities/initalValue";
import { setGroup, updateGroupLeader } from "../../redux/slice/GroupSlice";
import { setUserLogin } from "../../redux/slice/UserSlice";
import ProjectUpdateModal from "./ProjectUpdateModal";
import "./GroupMembersStyles.css";
import io from "socket.io-client";
import CustomButton from "../../components/Button/Button";
import GroupOutcomeCard from "../activity/GroupOutcomeCard";
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";

const socket = io(BASE_URL);
const { Text, Title } = Typography;

const GroupMembers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { group: groupDetails } = useSelector((state) => state.group);
  const { userLogin } = useSelector((state) => state.user);
  const groupId = userLogin?.groupId;
  const [isActive, setIsActive] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const jwt = localStorage.getItem("jwt");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  };
  console.log(userLogin);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await axios.get(`${BASE_URL}/user/profile`, config);
        dispatch(setUserLogin(userRes.data));
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        message.error("Lỗi khi tải thông tin người dùng.");
      }
    };

    fetchUserData();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const groupRes = await axios.get(
          `${BASE_URL}/group/group-infor/${groupId}`,
          config
        );
        dispatch(setGroup(groupRes.data?.[0]));
        const userRes = await axios.get(`${BASE_URL}/user/profile`, config);
        dispatch(setUserLogin(userRes.data));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [groupId, dispatch]);

  const fetchData = async () => {
    try {
      const groupRes = await axios.get(
        `${BASE_URL}/group/group-infor/${groupId}`,
        config
      );
      dispatch(setGroup(groupRes.data?.[0]));
      const userRes = await axios.get(`${BASE_URL}/user/profile`, config);
      dispatch(setUserLogin(userRes.data));
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    socket.emit("joinProject", userLogin?.projectInfo?.[0]?._id);
    socket.on("projectUpdated", (data) => {
      fetchData();
    });
    socket.emit("joinRoom", `${userLogin?._id}`);
    socket.on("notification", (data) => {
      fetchData();
    });
    return () => {
      socket.off("projectUpdated");
    };
  }, [userLogin]);

  const updateProjectStatus = async () => {
    try {
      const previousProject = JSON.parse(
        localStorage.getItem("previousProject")
      );

      if (!previousProject) {
        message.warning("Không tìm thấy dự án trước đó.");
        return;
      }

      const body = {
        name: previousProject?.project?.name,
        description: previousProject?.project?.description,
        status: "InProgress",
        declineMessage: "",
        professionId: previousProject?.projectCategories[0]?.professionId || [],
        specialtyIds: previousProject?.projectCategories[0]?.specialtyIds || [],
      };

      await axios.put(
        `${BASE_URL}/project/${previousProject?._id}/update_project_stutus`,
        body,
        config
      );
      const groupRes = await axios.get(
        `${BASE_URL}/group/group-infor/${groupId}`,
        config
      );
      dispatch(setGroup(groupRes.data[0]));
      localStorage.removeItem("previousProject");
      message.success("Trạng thái dự án đã được cập nhật về ban đầu.");
    } catch (error) {
      console.error("Error updating project status:", error);
      message.error("Có lỗi xảy ra khi cập nhật trạng thái dự án.");
    }
  };

  const handleOpenModal = () => {
    const isPlanning =
      groupDetails?.project?.status === "InProgress" ||
      groupDetails?.project?.status === "Changing";
    localStorage.setItem("previousProject", JSON.stringify(groupDetails));
    setIsUpdating(isPlanning);
    setProjectData(groupDetails);
    setIsModalVisible(true);
  };
  // Khi userLogin thay đổi (khi logout)

  useEffect(() => {
    if (groupDetails && userLogin?.role === 4 && userLogin.isLeader === true) {
      if (groupDetails.project?.status === "Decline") {
        Swal.fire({
          title: "Dự án bị từ chối",
          text: `Bạn bị từ chối với lý do: ${groupDetails.project?.declineMessage}`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Trở về dự án bán đầu",
          cancelButtonText: "Cập nhật dự án mới",
        }).then((result) => {
          if (result.isConfirmed) {
            const previousProject = JSON.parse(
              localStorage.getItem("previousProject")
            );
            if (previousProject) {
              updateProjectStatus();
            } else {
              message.warning("Không tìm thấy dự án trước đó.");
            }
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            handleOpenModal(); // Xử lý logic cập nhật dự án mới
          }
        });
      }
    }
  }, [groupDetails]);

  const handleModalClose = () => {
    setIsModalVisible(false);
    setProjectData(null);
  };

  const handleLeaderChange = (userId, userName) => {
    Swal.fire({
      title: `Bạn muốn đổi ${userName} thành trưởng nhóm không?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        const jwt = localStorage.getItem("jwt");
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
        };
        axios
          .patch(
            `${BASE_URL}/user/update_leader`,
            { _id: userId, isLeader: true },
            config
          )
          .then(() => {
            dispatch(updateGroupLeader({ groupId, userId }));
            Swal.fire("Đã cập nhật thành công!", "", "success");
          })
          .catch(() => {
            Swal.fire("Có lỗi xảy ra!", "Vui lòng thử lại sau.", "error");
          });
      }
    });
  };

  const handleUserDetailClick = (userId) => {
    navigate(`/user/${userId}/profile`);
  };
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    if (tabParam === "update-project") {
      // Chỉ mở modal khi groupDetails và project đã sẵn sàng
      if (groupDetails) {
        handleOpenModal();
      }
    } else if (tabParam === "update-outcome") {
      setIsActive(true);
    }
  }, [location, groupDetails]);

  const openMeet = () => {
    window.open(
      `https://meet.google.com/new?email=${encodeURIComponent(
        groupDetails?.mentors[0].email
      )}`,
      "_blank"
    );
  };

  return (
    <div>
      <div className="group-members-container">
        <div className="group-members-content">
          {groupDetails?.project && (
            <Card
              title={
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  Dự án: {groupDetails?.project?.name}
                </span>
              }
              className="group-members-project-card"
              extra={
                userLogin?.role === 4 &&
                userLogin?.isLeader && (
                  <CustomButton
                    content={
                      groupDetails?.project?.status === "Planning"
                        ? "Cập nhật dự án"
                        : "Sửa lại dự án"
                    }
                    onClick={handleOpenModal}
                  />
                )
              }
            >
              <div style={{ marginLeft: 9 }}>
                <p>
                  <Text strong>Mô tả dự án:</Text>{" "}
                  {groupDetails?.project?.description}
                </p>
                <p>
                  <Text strong>Lĩnh vực:</Text>{" "}
                  {groupDetails?.professionDetails
                    ?.map((profession) => `${profession.name}`)
                    .join(", ")}
                </p>
                <p>
                  <Text strong>Chuyên Môn:</Text>{" "}
                  {groupDetails?.specialtyDetails
                    ?.map((specialty) => `${specialty.name}`)
                    .join(", ")}
                </p>
                <p>
                  <Text strong>Tình trạng dự án:</Text>{" "}
                  <Badge
                    status={
                      groupDetails?.project?.status === "Decline"
                        ? "error"
                        : groupDetails?.project?.status === "Planning"
                        ? "warning"
                        : groupDetails?.project?.status === "Changing"
                        ? "warning"
                        : groupDetails?.project?.status === "InProgress"
                        ? "processing"
                        : "default"
                    }
                    text={
                      groupDetails?.project?.status === "Decline"
                        ? "Bị từ chối"
                        : groupDetails?.project?.status === "Planning"
                        ? "Đang chờ duyệt"
                        : groupDetails?.project?.status === "Changing"
                        ? "Đang chờ duyệt lại"
                        : groupDetails?.project?.status === "InProgress"
                        ? "Đang hoạt động"
                        : ""
                    }
                  />
                </p>
                {groupDetails?.project?.status === "Decline" && (
                  <p>
                    <Text strong>Lý do từ chối:</Text>{" "}
                    {groupDetails?.project?.declineMessage}
                  </p>
                )}
              </div>
            </Card>
          )}
          {!groupDetails?.project && (
            <Card
              className="group-members-project-card"
              style={{ marginBottom: 30 }}
              title={<Title level={4}>Dự án chưa được cập nhật!</Title>}
              extra={
                userLogin?.role === 4 &&
                userLogin?.isLeader && (
                  <CustomButton
                    onClick={handleOpenModal}
                    content={
                      !groupDetails?.project?.status
                        ? "Cập nhật dự án"
                        : "Sửa lại dự án"
                    }
                  />
                )
              }
            >
              Hãy cập nhật dự án của nhóm bạn
            </Card>
          )}
          <Card
            title={<Title level={4}>{groupDetails?.name}</Title>}
            className="group-members-list-card"
          >
            <List
              itemLayout="horizontal"
              dataSource={groupDetails?.members}
              renderItem={(member) => (
                <List.Item
                  className="group-members-list-item"
                  actions={[
                    member.isLeader ? (
                      <StarOutlined style={{ color: "#faad14" }} />
                    ) : userLogin?.role === 2 ? (
                      <SettingOutlined
                        onClick={() =>
                          handleLeaderChange(member._id, member.username)
                        }
                      />
                    ) : null,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        onClick={() => handleUserDetailClick(member._id)}
                        src={member.avatar}
                        style={{ backgroundColor: "rgb(98, 182, 203)" }}
                      >
                        {member?.username
                          ? member.username
                              .split(" ")
                              .pop()
                              .charAt(0)
                              .toUpperCase()
                          : "?"}
                      </Avatar>
                    }
                    title={<Text strong>{member.username}</Text>}
                    description={<i>{member.email}</i>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
        <div className="group-members-mentor-section">
          {groupDetails?.mentors?.length > 0 && (
            <div>
              <Card
                title={
                  <span>
                    Lịch họp của nhóm -{" "}
                    <Tag
                      color="#EC9A26"
                      style={{
                        cursor: "pointer",
                        fontSize: "1rem",
                        margin: "0px",
                        padding: "0.2rem 0.4rem",
                        color: "#FFF",
                      }}
                      onClick={() => openMeet()}
                    >
                      MeetUrl
                    </Tag>
                  </span>
                }
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
                style={{
                  padding: "16px",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  marginBottom: "20px",
                  display:
                    groupDetails?.matched[0]?.time !== null &&
                    groupDetails?.matched[0]?.time.length > 0
                      ? "block"
                      : "none",
                }}
              >
                {groupDetails?.matched[0]?.time !== null ? (
                  groupDetails?.matched[0]?.time.map((meet, index) => (
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
                        <Col span={24} style={{ lineHeight: "1.5rem" }}>
                          <p className="remove-default-style-p">
                            <strong>Buổi {index + 1}:</strong> {meet.title}
                          </p>
                          <p className="remove-default-style-p">
                            <strong>Thời gian:</strong>{" "}
                            {format(
                              new Date(meet.start),
                              "EEEE, dd'-'MM'-'yyyy",
                              {
                                locale: vi,
                              }
                            )}
                            &nbsp;từ&nbsp;
                            {format(new Date(meet.start), "HH:mm", {
                              locale: vi,
                            })}{" "}
                            -{" "}
                            {format(new Date(meet.end), "HH:mm", {
                              locale: vi,
                            })}
                          </p>
                        </Col>
                      </Row>
                    </Card.Grid>
                  ))
                ) : (
                  <Empty description="Chưa có lịch hãy vào lịch của các nhóm để tạo" />
                )}
              </Card>
              <GroupOutcomeCard groupId={groupId} active={isActive} />
              <Badge.Ribbon
                text={
                  groupDetails.matched[0].status === "Pending"
                    ? "Đang chờ duyệt"
                    : null
                }
                color="rgb(98, 182, 203)"
                placement="end"
              >
                <Card
                  title="Thông tin Mentor"
                  className="group-members-mentor-card"
                  hoverable
                  onClick={() =>
                    handleUserDetailClick(groupDetails.mentors[0]._id)
                  }
                >
                  <Avatar
                    src={groupDetails?.mentors[0].image}
                    size={80}
                    style={{
                      marginBottom: "8px",
                      backgroundColor: "rgb(98, 182, 203)",
                      fontSize: 30,
                    }}
                  >
                    {groupDetails?.mentors[0].username
                      ? groupDetails?.mentors[0].username
                          .split(" ")
                          .pop()
                          .charAt(0)
                          .toUpperCase()
                      : "?"}
                  </Avatar>
                  <Title level={5}>{groupDetails?.mentors[0].username}</Title>
                  <p>
                    <Text type="secondary">
                      {groupDetails?.mentors[0].email}
                    </Text>
                  </p>
                  <p>{groupDetails?.mentors[0].phoneNumber}</p>
                  <p>
                    <Text type="secondary">
                      {groupDetails?.mentorCategoryDetails
                        .map((c) => c.name)
                        .join(", ")}
                    </Text>
                  </p>
                </Card>
              </Badge.Ribbon>
            </div>
          )}
        </div>
      </div>
      {isModalVisible && (
        <ProjectUpdateModal
          show={isModalVisible}
          onHide={handleModalClose}
          projectData={projectData}
          onUpdateSuccess={() => {
            setIsModalVisible(false);
            axios
              .get(`${BASE_URL}/group/group-infor/${groupId}`, config)
              .then((res) => {
                dispatch(setGroup(res.data[0]));
              })
              .catch((err) => {
                console.error("Error reloading group data:", err);
                message.error("Lỗi khi tải lại dữ liệu nhóm.");
              });
          }}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};

export default GroupMembers;
