import React, { useEffect, useState } from "react";
import { Card, List, Avatar, Typography, Button, Badge, message } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { StarOutlined, SettingOutlined } from "@ant-design/icons";
import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "../../utilities/initalValue";
import { setGroup, updateGroupLeader } from "../../redux/slice/GroupSlice";
import { setUserLogin } from "../../redux/slice/UserSlice";
import "../../style/Class/GroupMembersStyles.css";
import GroupOutcomeCard from "../activity/GroupOutcomeCard";

const { Text, Title } = Typography;

const GroupDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { group: groupDetails } = useSelector((state) => state.group);
  const { userLogin } = useSelector((state) => state.user);
  const { groupId } = useParams();
  const jwt = localStorage.getItem("jwt");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const groupRes = await axios.get(
          `${BASE_URL}/group/group-infor/${groupId}`,
          config
        );
        dispatch(setGroup(groupRes.data[0]));

        const userRes = await axios.get(`${BASE_URL}/user/profile`, config);
        dispatch(setUserLogin(userRes.data));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [groupId, dispatch]);

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

  return (
    <div>
      <h3
        className="header-content-group-detail"
        style={{ color: "#FFF", margin: "1rem 0px" }}
      >
        Thông tin nhóm
      </h3>
      <div
        className="group-members-container"
        style={{ margin: "0px", padding: "0px" }}
      >
        <div className="group-members-content">
          {groupDetails?.project && (
            <Card
              title={
                <Title
                  level={4}
                  className="group-members-project-title"
                  style={{ margin: "0px" }}
                >
                  Dự án: {groupDetails?.project?.name}
                </Title>
              }
              className="group-members-project-card"
            >
              <p>
                <Text strong>Mô tả dự án:</Text>{" "}
                {groupDetails?.project?.description}
              </p>
              <p>
                <Text strong>Lĩnh vực:</Text>{" "}
                {groupDetails?.professionDetails?.join(", ")}
              </p>
              <p>
                <Text strong>Chuyên Môn:</Text>{" "}
                {groupDetails?.specialtyDetails?.join(", ")}
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
            </Card>
          )}
          {!groupDetails?.project && (
            <Card
              className="group-members-project-card"
              style={{ marginBottom: 30 }}
              title={
                <Title level={4} style={{ margin: "0px" }}>
                  Dự án chưa được cập nhật!
                </Title>
              }
            >
              Hãy nhắc nhở nhóm này chốt đề tài
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
                        style={{ backgroundColor: "#87d068" }}
                      >
                        {member.avatar ? null : member.username.charAt(0)}
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
            <Card
              title="Thông tin Mentor"
              className="group-members-mentor-card"
              hoverable
              onClick={() => handleUserDetailClick(groupDetails.mentors[0]._id)}
            >
              <Avatar
                src={groupDetails?.mentors[0].image}
                size={80}
                style={{ marginBottom: "8px" }}
              />
              <Title level={5}>{groupDetails?.mentors[0].username}</Title>
              <p>
                <Text type="secondary">{groupDetails?.mentors[0].email}</Text>
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
          )}
          <GroupOutcomeCard groupId={groupId} />
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
