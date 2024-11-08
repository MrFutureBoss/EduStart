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
  const [noGroupUsers, setNoGroupUsers] = useState([]);
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

  const checkInGroup = (userId, tempGroups) => {
    return tempGroups.some((group) => group.userIds.includes(userId));
  };

  const filteredGroupUsers = (group) => {
    return group.filter(
      (user) =>
        user.username
          .toLowerCase()
          .includes(tempGroupSearchText.toLowerCase()) ||
        user.email.toLowerCase().includes(tempGroupSearchText.toLowerCase()) ||
        user.rollNumber
          ?.toLowerCase()
          .includes(tempGroupSearchText.toLowerCase())
    );
  };

  // Handle Confirm Changes
  const handleConfirm = async () => {
    try {
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

      dispatch(
        setTempGroups(
          Object.entries(data).map(([groupName, users]) => ({
            groupName,
            userIds: users,
            _id: tempGroups.find((group) => group.groupName === groupName)?._id,
          }))
        )
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error.message || error);
      setData(previousData);
      message.error("Hoàn tác thay đổi do lỗi cập nhật");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    setIsConfirming(false);
    setDropTargetCard(null);
    await fetchGroups(); // Re-fetch data to reset the state without a page refresh
    message.info("Thay đổi bị hủy bỏ.");
  };

  const onDragStart = ({ active }) => {
    const activeId = active.id.split("-")[1];
    const item = Object.values(data)
      .flat()
      .find((i) => i._id.toString() === activeId);

    // Only allow drag if item matches the current userId
    if (item && item._id === userId) {
      setActiveItem(item);
      message.info(`Đang giữ thẻ: ${item.username}`);
    } else {
      // Prevent dragging by not setting the active item
      message.warning("Chỉ có thể kéo thả chính bạn");
    }
  };

  const onDragEnd = ({ active, over }) => {
    setActiveItem(null);
  
    if (!over) {
      message.error("Drop thất bại: Không có vị trí thả hợp lệ.");
      return;
    }
  
    const [activeContainer, activeId] = active.id.split("-");
    const [overContainer] = over.id.split("-");
  
    // Check if `activeContainer` exists in `data`
    if (!data[activeContainer]) {
      console.warn(`Group ${activeContainer} not found in data.`);
      return;
    }
  
    const itemToMove = data[activeContainer]?.find(
      (item) => item._id === activeId
    );
  
    if (!itemToMove) return;
  
    // Prevent dropping if `overContainer` has reached max students
    const overContainerCurrentCount = data[overContainer]?.length || 0;
    const overContainerMaxStudent = maxStudentMap[overContainer] || 0;
  
    if (overContainerCurrentCount >= overContainerMaxStudent) {
      message.warning(`Không thể thêm vào ${overContainer} vì đã đạt tối đa số lượng.`);
      return;
    }
  
    if (overContainer === "noGroup") {
      // Move to "noGroup" list
      const updatedActiveGroup = data[activeContainer].filter(
        (item) => item._id !== activeId
      );
      setData((prev) => ({
        ...prev,
        [activeContainer]: updatedActiveGroup || [],
      }));
      setNoGroupUsers((prev) => [...prev, itemToMove]);
      message.success(`${itemToMove.username} đã được di chuyển ra khỏi nhóm.`);
    } else if (activeContainer !== overContainer) {
      const updatedActiveGroup = data[activeContainer].filter(
        (item) => item._id !== activeId
      );
      const updatedOverGroup = [...(data[overContainer] || []), itemToMove];
  
      setData((prev) => ({
        ...prev,
        [activeContainer]: updatedActiveGroup || [],
        [overContainer]: updatedOverGroup || [],
      }));
  
      setPopconfirmTitle(
        `Bạn muốn chuyển ${itemToMove.username} sang ${overContainer}?`
      );
      setDropTargetCard(overContainer);
      setIsConfirming(true);
    }
  };
  

  const sortedGroupKeys = Object.keys(data)
  .sort((a, b) => {
    const aNum = parseInt(a.match(/\d+/)?.[0], 10);
    const bNum = parseInt(b.match(/\d+/)?.[0], 10);
    return aNum - bNum;
  })
  .sort((groupKeyA, groupKeyB) => {
    const isUserInGroupA = data[groupKeyA]?.some((user) => user._id === userId);
    const isUserInGroupB = data[groupKeyB]?.some((user) => user._id === userId);
    
    // Place the user's group at the top
    if (isUserInGroupA && !isUserInGroupB) return -1;
    if (!isUserInGroupA && isUserInGroupB) return 1;
    return 0; // Maintain existing order for groups without the user
  });

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
              <h3>
                Danh sách nhóm
              </h3>
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
            {sortedGroupKeys
              .filter(
                (groupKey) =>
                  selectedGroups.length === 0 ||
                  selectedGroups.includes(groupKey)
              )
              .map((groupKey) => {
                const users = data[groupKey] || [];
                const maxStudent = maxStudentMap[groupKey] || 0;
                const currentStudentCount = users.length;
                return (
                  <Col xs={24} sm={12} md={12} lg={4} key={groupKey}>
                    <Card
                      title={
                        <div
                          className="card-groupname"
                          style={{ height: "fit-content" }}
                        >
                          {groupKey}
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
                          data[groupKey].length > 0
                            ? data[groupKey].map(
                                (item) => `${groupKey}-${item._id}`
                              )
                            : [`${groupKey}-empty`]
                        }
                        strategy={verticalListSortingStrategy}
                      >
                        {data[groupKey].length > 0 ? (
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
                              <List
                                bordered
                                dataSource={filteredGroupUsers(data[groupKey])}
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

                              <List
                                style={{
                                  display:
                                    currentStudentCount === maxStudent
                                      ? "none"
                                      : "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  textAlign: "center",
                                  padding: "10px 0px",
                                  fontWeight: "600",
                                }}
                              >
                                <p className="remove-default-style-p">
                                  + Tham gia vào nhóm
                                </p>
                              </List>
                            </Popconfirm>
                          </Tooltip>
                        ) : (
                          <SortableItem
                            id={`${groupKey}-empty`}
                            item={
                              <Empty
                                description="Chưa có ai trong nhóm này"
                                style={{ padding: "20px" }}
                              />
                            }
                          />
                        )}
                      </SortableContext>

                      <div
                        className="cardbody-numberstudent"
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          padding: "10px 0", // Adjust padding as needed
                          marginTop: "auto", // Pushes footer to the bottom
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
    </DndContext>
  );
};

export default SortableCards;
