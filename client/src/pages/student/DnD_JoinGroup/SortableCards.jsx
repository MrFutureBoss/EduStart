import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  Card,
  List,
  Empty,
  message,
  Popconfirm,
  Avatar,
  Row,
  Col,
  Tooltip,
  Select,
  Drawer,
  Button,
} from "antd";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { BASE_URL } from "../../../utilities/initalValue";
import {
  setTempGroups,
  setTotalTempGroups,
} from "../../../redux/slice/TempGroupSlice";
import "../../../style/Class/ClassDetail.css";
import Search from "antd/es/transfer/search";
import avatarImage from "../../../assets/images/459233558_122150574488258176_5118808073589257292_n.jpg";
import Highlighter from "react-highlight-words";
import { setUserProfile } from "../../../redux/slice/UserSlice";
import { StarOutlined } from "@ant-design/icons";

const SortableCards = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
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

  const [classId, setClassId] = useState(null);
  const [data, setData] = useState({});
  const [previousData, setPreviousData] = useState({});
  const [dropTargetCard, setDropTargetCard] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [popconfirmTitle, setPopconfirmTitle] = useState("");
  const [tempGroupSearchText, setTempGroupSearchText] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [maxStudentMap, setMaxStudentMap] = useState({});
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Fetch user info
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/user/${userId}`, config);
        dispatch(setUserProfile(response.data));
        setClassId(response.data?.classId);
      } catch (error) {
        console.error(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [dispatch, config, userId]);

  // Fetch groups and users
  useEffect(() => {
    if (!classId) return;
    const fetchGroups = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/tempgroup/class/${classId}`,
          config
        );
        dispatch(setTempGroups(response.data?.data));
        dispatch(setTotalTempGroups(response.data?.total));

        const maxStudentData = response.data?.data.reduce((acc, group) => {
          acc[group.groupName] = group.maxStudent || 0;
          return acc;
        }, {});

        setMaxStudentMap(maxStudentData);

        const groupData = response.data?.data.reduce((acc, group) => {
          acc[group.groupName] = group.userIds;
          return acc;
        }, {});

        setData(groupData);
        setPreviousData(groupData);
      } catch (error) {
        console.error(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchGroups();
  }, [classId, config, dispatch]);

  const fetchGroups = async () => {
    if (!classId) return;
    try {
      const response = await axios.get(
        `${BASE_URL}/tempgroup/class/${classId}`,
        config
      );
      dispatch(setTempGroups(response.data?.data));
      dispatch(setTotalTempGroups(response.data?.total));

      const maxStudentData = response.data?.data.reduce((acc, group) => {
        acc[group.groupName] = group.maxStudent || 0;
        return acc;
      }, {});

      setMaxStudentMap(maxStudentData);

      const groupData = response.data?.data.reduce((acc, group) => {
        acc[group.groupName] = group.userIds;
        return acc;
      }, {});

      setData(groupData);
      setPreviousData(groupData);
    } catch (error) {
      console.error(
        error.response ? error.response.data.message : error.message
      );
    }
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, config]);

  const tempGroups = useSelector((state) => state.tempGroup.data || []);
  const userProfile = useSelector((state) => state.user.userProfile || []);

  const normalizedUserId = String(userProfile._id); // Chuyển userProfile._id thành chuỗi để chắc chắn
  const isUserInAnyGroup = tempGroups.some((group) => {
    // Map through `userIds` to extract `_id` from each user object
    const normalizedUserIds = group.userIds
      .filter(Boolean) // Remove any null or undefined values
      .map((user) => String(user._id)); // Chuyển mỗi _id thành chuỗi cho so sánh chính xác

    console.log("Checking group:", group.groupName);
    console.log("Normalized User IDs:", normalizedUserIds);
    console.log("Current user ID:", normalizedUserId);

    // Check if `normalizedUserId` is in the list of `normalizedUserIds`
    return normalizedUserIds.includes(normalizedUserId);
  });

  console.log("Is user in any group?", isUserInAnyGroup);

  const filteredGroupUsers = (group) => {
    return group.filter(
      (user) =>
        (user.username &&
          user.username
            .toLowerCase()
            .includes(tempGroupSearchText.toLowerCase())) ||
        (user.email &&
          user.email
            .toLowerCase()
            .includes(tempGroupSearchText.toLowerCase())) ||
        (user.rollNumber &&
          user.rollNumber
            .toLowerCase()
            .includes(tempGroupSearchText.toLowerCase()))
    );
  };

  const handleConfirm = async () => {
    try {
      if (dropTargetCard === "noGroup") {
        // Removing user from group
        const activeContainer = Object.keys(data).find((key) =>
          data[key].some((user) => user._id === userId)
        );

        if (activeContainer) {
          const groupId = tempGroups.find(
            (group) => group.groupName === activeContainer
          )?._id;

          await axios.put(
            `${BASE_URL}/tempgroup/${groupId}`,
            {
              userIds: data[activeContainer]
                .filter((user) => user._id !== userId)
                .map((user) => user._id),
            },
            config
          );

          await fetchGroups(); // Refresh data
          message.success("Bạn đã được loại bỏ khỏi nhóm.");
        }
      } else {
        // Regular group confirmation logic
        const groupRequests = Object.entries(data).map(([groupName, users]) => {
          const groupId = tempGroups.find(
            (group) => group.groupName === groupName
          )?._id;
          if (groupId) {
            return axios.put(
              `${BASE_URL}/tempgroup/${groupId}`,
              { userIds: users.map((user) => user._id) },
              config
            );
          }
          return null;
        });

        await Promise.all(groupRequests.filter(Boolean));
        message.success("Cập nhật thành công!");
      }

      setIsConfirming(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error.message || error);
      message.error("Hoàn tác thay đổi do lỗi cập nhật");
    } finally {
      setIsConfirming(false);
      setDropTargetCard(null);
    }
  };

  const handleCancel = async () => {
    setIsConfirming(false);
    setDropTargetCard(null);
    await fetchGroups(); // Re-fetch data to reset the state without a page refresh
    message.info("Thay đổi bị hủy bỏ.");
  };

  const updatedTempGroups = useMemo(() => {
    if (isUserInAnyGroup) {
      return tempGroups;
    }

    return [
      {
        _id: "temp-noGroup",
        groupName: "Bạn chưa vào nhóm",
        userIds: [
          {
            _id: userProfile._id,
            username: userProfile.username,
            email: userProfile.email,
            rollNumber: userProfile.rollNumber,
          },
        ],
        maxStudent: 0,
      },
      ...tempGroups,
    ];
  }, [tempGroups, userProfile, isUserInAnyGroup]);

  const sortedGroupKeys = useMemo(() => {
    return updatedTempGroups
      .map((group) => group.groupName)
      .sort((a, b) => {
        if (a === "Bạn chưa vào nhóm") return -1;
        if (b === "Bạn chưa vào nhóm") return 1;

        const aNum = parseInt(a.match(/\d+/)?.[0], 10);
        const bNum = parseInt(b.match(/\d+/)?.[0], 10);
        return aNum - bNum;
      });
  }, [updatedTempGroups]);

  const onDragStart = ({ active }) => {
    const activeId = active.id.split("-")[1];
    console.log("Dragging item:", activeId);

    if (activeId === userId) {
      setActiveItem(userProfile);
      message.info(`Đang giữ thẻ: ${userProfile.username}`);
    } else {
      setActiveItem(null);
      message.warning("Chỉ có thể kéo thả chính bạn.");
    }
  };

  const onDragEnd = async ({ active, over }) => {
    setActiveItem(null);
  
    if (!over) {
      message.error("Thả thất bại: Không có vị trí thả hợp lệ.");
      return;
    }
  
    const [activeContainer, activeId] = active.id.split("-");
    const [overContainer] = over.id.split("-");
  
    // Get the item being dragged
    const itemToMove = activeContainer === "Bạn chưa vào nhóm" 
      ? userProfile 
      : data[activeContainer]?.find((item) => item._id === activeId);
  
    if (!itemToMove || itemToMove._id !== userId) return;
    const targetGroup = tempGroups.find(group => group.groupName === overContainer);
    const targetGroupUsers = data[overContainer] || [];
    const targetGroupMax = maxStudentMap[overContainer] || targetGroup?.maxStudent || 0;
  
    if (overContainer !== "Bạn chưa vào nhóm" && overContainer !== "noGroup" &&targetGroupUsers.length >= targetGroupMax) {
      message.warning(`Không thể thêm sinh viên vào nhóm ${overContainer}. Đã đạt tối đa.`);
      return; 
    }
  
    try {
      if (activeContainer === "Bạn chưa vào nhóm" && overContainer !== "Bạn chưa vào nhóm") {
        // Adding user from "Bạn chưa vào nhóm" to another group
        const overGroupId = tempGroups.find(group => group.groupName === overContainer)?._id;
  
        if (overGroupId) {
          await axios.put(
            `${BASE_URL}/tempgroup/${overGroupId}`,
            {
              userIds: [...(data[overContainer] || []).map(user => user._id), userId],
            },
            config
          );
  
          await fetchGroups(); // Refresh data after updating
          message.success(`Đã thêm ${itemToMove.username} vào nhóm ${overContainer}`);
        }
      } else if (activeContainer !== overContainer) {
        // Moving user from one group to another or to "Bạn chưa vào nhóm"
        const activeGroupId = tempGroups.find(group => group.groupName === activeContainer)?._id;
        const overGroupId = tempGroups.find(group => group.groupName === overContainer)?._id;
  
        if (activeGroupId) {
          // Update the old group to remove the user
          await axios.put(
            `${BASE_URL}/tempgroup/${activeGroupId}`,
            {
              userIds: data[activeContainer]
                .filter(user => user._id !== userId)
                .map(user => user._id),
            },
            config
          );
        }
  
        if (overGroupId) {
          // Add the user to the new group
          await axios.put(
            `${BASE_URL}/tempgroup/${overGroupId}`,
            {
              userIds: [...data[overContainer].map(user => user._id), userId],
            },
            config
          );
        }
  
        await fetchGroups(); // Refresh data after updating
        message.success(`Đã chuyển ${itemToMove.username} vào nhóm ${overContainer}`);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error.message || error);
      message.error("Hoàn tác thay đổi do lỗi cập nhật");
    } finally {
      setIsConfirming(false);
      setDropTargetCard(null);
    }
  };
  
  
  

  const handleOpenDrawer = (groupKey) => {
    setSelectedGroupUsers(data[groupKey] || []);
    setSelectedGroupName(groupKey);
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <Row gutter={[32, 16]}>
        <Col sm={24} md={24} lg={24}>
          <Row style={{ marginBottom: "2rem" }}>
            <Col
              sm={24}
              style={{
                marginTop: "5px",
                marginBottom: "15px",
                display: "flex",
                gap: "2rem",
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <h3>Danh sách nhóm</h3>
              <div
                style={{
                  display: "flex",
                  gap: "2rem",
                  justifyContent: "center",
                }}
              >
                <Select
                  mode="multiple"
                  maxCount={6}
                  placeholder="Chọn các nhóm để xem thông tin"
                  style={{ width: "16rem", height: "fit-content" }}
                  onChange={(value) => setSelectedGroups(value)}
                >
                  {tempGroups.map((tp) => (
                    <Select.Option key={tp?._id} value={tp?.groupName}>
                      {tp?.groupName}
                    </Select.Option>
                  ))}
                </Select>
                <div style={{ width: "25rem" }}>
                  <Search
                    placeholder="Nhập tên, email hoặc MSSV"
                    onChange={(e) => setTempGroupSearchText(e.target.value)}
                  />
                </div>
              </div>
            </Col>
          </Row>
          <Row
            gutter={[32, 16]}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Col
              xs={24}
              sm={12}
              md={12}
              lg={6}
              style={{ display: !isUserInAnyGroup ? "none" : "block" }}
            >
              <Card
                title={
                  <div
                    className="card-groupname"
                    style={{ height: "fit-content" }}
                  >
                    Hủy vào nhóm
                  </div>
                }
                bodyStyle={{
                  padding: "0px",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
                headStyle={{
                  background:
                    "linear-gradient(-45deg, #005241, #128066, #00524f, #008d87)",
                  color: "white",
                }}
                style={{
                  width: "18rem",
                  height: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                bordered
                className="card-groupstudents"
              >
                <SortableContext
                  items={
                    !isUserInAnyGroup
                      ? [`noGroup-${userProfile._id}`]
                      : [`noGroup-empty`]
                  }
                  strategy={verticalListSortingStrategy}
                >
                  <Tooltip title="Giữ và kéo để thao tác">
                    <Popconfirm
                      title={popconfirmTitle}
                      onConfirm={handleConfirm}
                      onCancel={() => setIsConfirming(false)}
                      visible={isConfirming && dropTargetCard === "noGroup"}
                      okText="Có"
                      cancelText="Không"
                    >
                      {!isUserInAnyGroup ? (
                        <SortableItem
                          id={`noGroup-${userProfile._id}`}
                          item={userProfile}
                        />
                      ) : (
                        <SortableItem
                          id="noGroup-empty"
                          item={{
                            isEmpty: true,
                            description:
                              "Thả vào đây để không tham gia nhóm nào",
                          }}
                        />
                      )}
                    </Popconfirm>
                  </Tooltip>
                </SortableContext>
              </Card>
            </Col>

            {sortedGroupKeys
              .filter(
                (groupKey) =>
                  selectedGroups.length === 0 ||
                  selectedGroups.includes(groupKey)
              )
              .map((groupKey) => {
                const group = updatedTempGroups.find(
                  (g) => g.groupName === groupKey
                );
                const users = data[groupKey] || group.userIds || [];
                const maxStudent =
                  maxStudentMap[groupKey] || group.maxStudent || 0;
                const currentStudentCount = users.length;

                return (
                  <Col xs={24} sm={12} md={12} lg={6} key={group._id}>
                    <Card
                      title={<div className="card-groupname">{groupKey}</div>}
                      bodyStyle={{
                        padding: "0px",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                      headStyle={{
                        background:
                          "linear-gradient(-45deg, #005241, #128066, #00524f, #008d87)",
                        color: "white",
                      }}
                      style={{
                        width: "18rem",
                        height: "auto",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                      bordered
                      className="card-groupstudents"
                    >
                      <SortableContext
                        items={
                          users.length > 0
                            ? users.map((user) => `${groupKey}-${user._id}`)
                            : [`${groupKey}-empty`]
                        }
                        strategy={verticalListSortingStrategy}
                      >
                        {users.length > 0 ? (
                          <Tooltip title="Giữ và kéo để thao tác">
                            <Popconfirm
                              title={popconfirmTitle}
                              onConfirm={handleConfirm}
                              onCancel={handleCancel}
                              visible={
                                isConfirming && dropTargetCard === groupKey
                              }
                              okText="Có"
                              cancelText="Không"
                            >
                              {/* <List>
                                <Button
                                  onClick={() => handleOpenDrawer(groupKey)}
                                >
                                  Bấm vào đây xem
                                </Button>
                              </List> */}
                                <List
                                  bordered
                                  dataSource={filteredGroupUsers(users)}
                                  renderItem={(item) => (
                                    <SortableItem
                                      key={item._id}
                                      id={`${groupKey}-${item._id}`}
                                      item={item}
                                      userId={userId}
                                    >
                                      <Highlighter
                                        highlightClassName="highlight-text"
                                        searchWords={
                                          tempGroupSearchText
                                            ? [tempGroupSearchText]
                                            : []
                                        }
                                        autoEscape={true}
                                        textToHighlight={`${item.username} (${item.email}) (${item.rollNumber})`}
                                      />
                                    </SortableItem>
                                  )}
                                />
                            </Popconfirm>
                          </Tooltip>
                        ) : (
                          <SortableItem
                            id={`${groupKey}-empty`}
                            item={
                              groupKey === "Bạn chưa vào nhóm" ? (
                                <Empty description="Bạn chưa vào nhóm nào. Thả vào đây để không tham gia nhóm." />
                              ) : (
                                <Empty description="Chưa có ai trong nhóm này" />
                              )
                            }
                          />
                        )}
                      </SortableContext>

                      {groupKey !== "Bạn chưa vào nhóm" && (
                        <div
                          className="cardbody-numberstudent"
                          style={{
                            textAlign: "center",
                            fontWeight: "bold",
                            padding: "10px 0",
                            marginTop: "auto",
                          }}
                        >
                          <span>Số lượng sinh viên trong nhóm: </span>
                          <span
                            style={{
                              color:
                                currentStudentCount < maxStudent
                                  ? "red"
                                  : "green",
                            }}
                          >
                            {currentStudentCount}
                          </span>
                          /<span>{maxStudent}</span>
                        </div>
                      )}
                    </Card>
                  </Col>
                );
              })}
          </Row>
        </Col>
      </Row>
      <DragOverlay>
        {activeItem ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px",
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <Avatar
              src={avatarImage}
              size={24}
              style={{ marginRight: "8px" }}
            />
            <div>
              <p style={{ padding: "0px", margin: "0px" }}>
                {activeItem.username}
              </p>
              <p style={{ padding: "0px", margin: "0px" }}>
                {activeItem.email}
              </p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
      <Drawer></Drawer>
    </DndContext>
  );
};

export default SortableCards;
