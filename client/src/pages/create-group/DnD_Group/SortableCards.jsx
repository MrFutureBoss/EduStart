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
  Pagination,
  Tooltip,
  Select,
  Drawer,
  Button,
  Dropdown,
  Menu,
  Tag,
} from "antd";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
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
  setTotalWaitUsers,
  setWaitUserList,
} from "../../../redux/slice/TempGroupSlice";
import "../../../style/Class/ClassDetail.css";
import Search from "antd/es/transfer/search";
import { useParams } from "react-router-dom";
import avatarImage from "../../../assets/images/459233558_122150574488258176_5118808073589257292_n.jpg";
import Highlighter from "react-highlight-words";
import { SortableItem2 } from "./SortableItem2";
import {
  DragOutlined,
  EditOutlined,
  FileSearchOutlined,
  FormOutlined,
  PauseCircleOutlined,
  PlusCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import SmallModal from "../../../components/Modal/SmallModal";
import AddStudent from "../AddStudent";

const SortableCards = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  const { className } = useParams();
  const [classId, setClassId] = useState(null);
  const [data, setData] = useState({});
  const [previousData, setPreviousData] = useState({});
  const [dropTargetCard, setDropTargetCard] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isWaitListConfirming, setIsWaitListConfirming] = useState(false);
  const [popconfirmTitle, setPopconfirmTitle] = useState("");
  const [searchText, setSearchText] = useState("");
  const [tempGroupSearchText, setTempGroupSearchText] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [maxStudentMap, setMaxStudentMap] = useState({});
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const [drawerGroupKey, setDrawerGroupKey] = useState(null);
  const [maxStudentInGroup, setMaxStudentInGroup] = useState(0);
  const [currentStudentsInGroup, setCurrentStudentsInGroup] = useState(0);
  const [isShowModal, setIsShowModal] = useState(false);
  const [dndActive, setDndActive] = useState(false);
  //Phân trang
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(6);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
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

  // /Danh sách nhóm chưa chốt xong và danh sách sinh trong nhóm đó
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
          acc[group.groupName] = group.maxStudent || 0; // Assign maxStudent
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
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [classId, config, currentPage, pageSize, dispatch]);

  const fetchWaitUserList = async (limit = 6, skip = 0) => {
    try {
      console.log(
        `Fetching wait user list with limit: ${limit}, skip: ${skip}`
      );

      const response = await axios.get(`${BASE_URL}/class/ungroup/${classId}`, {
        ...config,
        params: { limit, skip },
      });

      console.log("API response received:", response.data);

      if (response.data) {
        // Confirm data structure is as expected
        dispatch(setWaitUserList(response.data?.data));
        dispatch(setTotalWaitUsers(response.data?.total));
        console.log("Data successfully dispatched to store.");
      } else {
        console.warn(
          "Warning: Response does not contain expected data structure."
        );
      }
    } catch (error) {
      console.error("Error fetching wait user list:", error);
    }
  };

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

  const tempGroups = useSelector((state) => state.tempGroup.data || []);
  const waitUserList = useSelector(
    (state) => state.tempGroup.waituserlist || []
  );
  const totalWaitUsers = useSelector((state) => state.tempGroup.waittotal || 0);

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

  const Dropzone = ({ id, onDrop, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
      <div
        ref={setNodeRef}
        style={{
          backgroundColor: isOver ? "#f0f0f0" : "transparent",
          transition: "background-color 0.2s ease",
        }}
        onDrop={onDrop}
      >
        {children}
      </div>
    );
  };

  const handleDrop = (droppedItemId, groupKey) => {
    const droppedUser = waitUserList.find((user) => user._id === droppedItemId);
    if (droppedUser) {
      setData((prevData) => ({
        ...prevData,
        [groupKey]: [...prevData[groupKey], droppedUser],
      }));
    }
  };

  const handleOpenModal = (groupKey, maxStudent, currentStudentCount) => {
    setIsShowModal(true);
    setDndActive(false);
    setDrawerGroupKey(groupKey);
    setMaxStudentInGroup(maxStudent);
    setCurrentStudentsInGroup(currentStudentCount);
  };

  const handleCloseModal = () => {
    setIsShowModal(false);
  };

  const handleOpenDrawer = (groupKey) => {
    setDrawerGroupKey(groupKey);
    setIsOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false);
    setDrawerGroupKey(null);
  };

  const handleRemoveUser = async (userId) => {
    const group = tempGroups.find((grp) => grp.groupName === drawerGroupKey);
    if (!group) {
      message.error("Không tìm thấy nhóm.");
      return;
    }

    const groupId = group._id;

    try {
      const updatedUserIds = data[drawerGroupKey]
        .filter((user) => user._id !== userId)
        .map((user) => user._id);

      console.log("Updating user IDs:", updatedUserIds);
      const response = await axios.put(
        `${BASE_URL}/tempgroup/${groupId}`,
        { userIds: updatedUserIds },
        config
      );

      if (response.status === 200) {
        setData((prevData) => ({
          ...prevData,
          [drawerGroupKey]: prevData[drawerGroupKey].filter(
            (user) => user._id !== userId
          ),
        }));
        message.success("Đã rời nhóm thành công!");
        await fetchWaitUserList(6, 0);
      } else {
        console.error("Unexpected response:", response);
        message.error("Có lỗi xảy ra khi rời nhóm.");
      }
    } catch (error) {
      console.error(
        "Lỗi khi rời nhóm:",
        error.response || error.message || error
      );
      message.error(
        `Có lỗi xảy ra khi rời nhóm: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };
  const handleOpenAddByDnD = () => {
    setDndActive(true);
    setIsShowModal(false);
  };
  const handleCloseAddByDnd = () => {
    setDndActive(false);
    message.info("Đã dừng chế độ kéo thả");
  };
  // const handleConfirm = async () => {
  //   try {
  //     // Only update actual groups in the database, ignoring `waitUserList`
  //     const groupRequests = Object.entries(data).map(([groupName, users]) => {
  //       const groupId = tempGroups.find(
  //         (group) => group.groupName === groupName
  //       )?._id;
  //       if (groupId) {
  //         return axios.put(
  //           `${BASE_URL}/tempgroup/${groupId}`,
  //           { userIds: users.map((user) => user._id) },
  //           config
  //         );
  //       }
  //       return null;
  //     });

  //     await Promise.all(groupRequests.filter(Boolean));
  //     message.success("Cập nhật thành công!");

  //     // Update Redux with the latest groups data
  //     dispatch(
  //       setTempGroups(
  //         Object.entries(data).map(([groupName, users]) => ({
  //           groupName,
  //           userIds: users,
  //           _id: tempGroups.find((group) => group.groupName === groupName)?._id,
  //         }))
  //       )
  //     );
  //   } catch (error) {
  //     console.error("Lỗi khi cập nhật:", error.message || error);
  //     setData(previousData);
  //     message.error("Hoàn tác thay đổi do lỗi cập nhật");
  //   } finally {
  //     setIsConfirming(false); // Ensure Popconfirm is closed
  //     setIsWaitListConfirming(false);
  //   }
  // };

  const handleWaitListConfirm = async () => {
    setIsWaitListConfirming(false);
    try {
      // Map over each group and perform an update request, allowing empty user arrays
      const groupRequests = Object.entries(data).map(
        async ([groupName, users]) => {
          const groupId = tempGroups.find(
            (group) => group.groupName === groupName
          )?._id;
          if (groupId !== undefined) {
            await axios.put(
              `${BASE_URL}/tempgroup/${groupId}`,
              { userIds: users.map((user) => user._id) }, // Allows empty arrays to be passed
              config
            );
          }
        }
      );
      // Wait for all updates to complete
      await Promise.all(groupRequests);

      // Fetch updated waitUserList data only
      const waitListResponse = await axios.get(
        `${BASE_URL}/class/ungroup/${classId}`,
        config
      );

      // Update Redux with the latest waitUserList
      dispatch(setWaitUserList(waitListResponse.data.data));
      dispatch(setTotalWaitUsers(waitListResponse.data.total));

      // Show success message regardless of empty or non-empty data
      message.success("Danh sách đã cập nhật lại");
    } catch (error) {
      console.error("Error updating waitUserList:", error.message || error);
      message.success("Danh sách đã cập nhật lại");
    } finally {
      setIsWaitListConfirming(false); // Ensure Popconfirm is closed
    }
  };

  const handleCancel = async () => {
    // Fetch data
    await fetchWaitUserList();
    await fetchGroups();

    setIsConfirming(false);
    setIsWaitListConfirming(false);
    message.info("Thay đổi bị hủy bỏ.");
    setData(previousData);
    setDropTargetCard(null);
  };

  const onDragStart = ({ active }) => {
    const activeId = active.id.split("-")[1];
    const item = [...Object.values(data).flat(), ...waitUserList].find(
      (i) => i._id.toString() === activeId
    );

    if (item) {
      setActiveItem(item);
      message.info(`Đang giữ thẻ: ${item.username}`);
      message.info("Thả vào nhóm để thêm sinh viên vào nhóm đó");
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

    const itemToMove =
      waitUserList.find((item) => item._id === activeId) ||
      data[activeContainer]?.find((item) => item._id === activeId);

    if (!itemToMove) return;

    if (
      activeContainer === "waitUserList" &&
      overContainer !== "waitUserList"
    ) {
      const updatedWaitUserList = waitUserList.filter(
        (item) => item._id !== activeId
      );
      const updatedGroup = [...(data[overContainer] || []), itemToMove];

      setData((prev) => ({
        ...prev,
        [overContainer]: updatedGroup,
      }));

      dispatch(setWaitUserList(updatedWaitUserList));
      dispatch(setTotalWaitUsers(updatedWaitUserList.length));

      // Make sure to trigger Popconfirm
      setPopconfirmTitle(
        `Bạn muốn chuyển ${itemToMove.username} sang nhóm ${overContainer}?`
      );
      setDropTargetCard(overContainer);
      setIsWaitListConfirming(true); // Force Popconfirm even if waitUserList is empty
    } else if (
      overContainer === "waitUserList" &&
      activeContainer !== "waitUserList"
    ) {
      const updatedGroup = data[activeContainer].filter(
        (item) => item._id !== activeId
      );
      const updatedWaitUserList = [...waitUserList, itemToMove];

      setData((prev) => ({
        ...prev,
        [activeContainer]: updatedGroup,
      }));

      dispatch(setWaitUserList(updatedWaitUserList));
      dispatch(setTotalWaitUsers(updatedWaitUserList.length));

      setPopconfirmTitle(
        `Bạn muốn chuyển ${itemToMove.username} ra khỏi nhóm?`
      );
      setIsWaitListConfirming(true);
    } else if (activeContainer !== overContainer) {
      const updatedActiveGroup = data[activeContainer].filter(
        (item) => item._id !== activeId
      );
      const updatedOverGroup = [...(data[overContainer] || []), itemToMove];

      setData((prev) => ({
        ...prev,
        [activeContainer]: updatedActiveGroup,
        [overContainer]: updatedOverGroup,
      }));

      setPopconfirmTitle(
        `Bạn muốn chuyển ${itemToMove.username} sang ${overContainer}?`
      );
      setDropTargetCard(overContainer);
      setIsConfirming(true);
      setIsWaitListConfirming(false);
    }
  };

  const sortedGroupKeys = Object.keys(data).sort((a, b) => {
    const aNum = parseInt(a.match(/\d+/)?.[0], 10);
    const bNum = parseInt(b.match(/\d+/)?.[0], 10);
    return aNum - bNum;
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <Row gutter={[32, 16]}>
        <Col sm={24} md={24} lg={6}>
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
              <h5>Danh sách sinh viên chưa có nhóm</h5>
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
            </Col>
          </Row>
          <Row style={{ margin: "10px auto" }}>
            <Col sm={24}>Số lượng sinh viên chưa nhóm: {totalWaitUsers}</Col>
          </Row>
          <Row>
            <Col sm={24}>
              {dndActive ? (
                <Tooltip
                  title="Tắt chế độ kéo thả"
                  style={{ display: "flex", textAlign: "center" }}
                >
                  <Button
                    color="danger"
                    variant="solid"
                    style={{
                      margin: "10px 0px",
                    }}
                    onClick={handleCloseAddByDnd}
                  >
                    <PauseCircleOutlined style={{ fontSize: "1.1rem" }} />
                    &nbsp;Dừng chế độ kéo thả
                  </Button>
                </Tooltip>
              ) : (
                <></>
              )}
            </Col>
          </Row>
          <SortableContext
            disabled={!dndActive || isConfirming || isWaitListConfirming}
            items={
              totalWaitUsers > 0
                ? waitUserList.map((user) => `waitUserList-${user._id}`)
                : ["waitUserList-empty"]
            }
            strategy={verticalListSortingStrategy}
          >
            {totalWaitUsers > 0 ? (
              <Tooltip
                title={dndActive ? "Giữ và kéo để thao tác" : ""}
                disabled={!dndActive}
              >
                <Popconfirm
                  title={popconfirmTitle}
                  onConfirm={handleWaitListConfirm}
                  onCancel={handleCancel}
                  visible={isWaitListConfirming}
                  okText="Có"
                  cancelText="Không"
                >
                  <List
                    className="list-container-groupstudent"
                    style={{ width: "100%" }}
                    bordered
                    dataSource={filteredUsers}
                    renderItem={(user) => (
                      <SortableItem
                        key={user._id}
                        id={`waitUserList-${user._id}`}
                        item={user}
                        cursor={!dndActive}
                      />
                    )}
                  />
                </Popconfirm>
              </Tooltip>
            ) : (
              <Popconfirm
                title={popconfirmTitle}
                onConfirm={handleWaitListConfirm}
                onCancel={handleCancel}
                visible={isWaitListConfirming}
                okText="Có"
                cancelText="Không"
              >
                <SortableItem
                  id="waitUserList-empty"
                  item={
                    <Empty
                      description="Chưa có sinh viên nào trong danh sách chờ"
                      style={{ padding: "20px" }}
                    />
                  }
                />
              </Popconfirm>
            )}
          </SortableContext>

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
                  // eslint-disable-next-line jsx-a11y/anchor-is-valid
                  return <a style={{ padding: "0 4px" }}>{page}</a>;
                }
                return originalElement;
              }}
            />
          </Row>
        </Col>

        <Col sm={24} md={24} lg={18}>
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
              <h3>Danh sách nhóm</h3>
            </Col>
          </Row>
          <Row style={{ marginBottom: "2rem" }}>
            <Col
              sm={24}
              style={{
                marginTop: "5px",
                marginBottom: "15px",
                display: "flex",
                gap: "2rem",
                justifyContent: "center",
              }}
            >
              <Select
                mode="multiple"
                maxCount={6}
                placeholder="Chọn lọc nhóm"
                style={{ width: "16rem" }}
                onChange={(value) => setSelectedGroups(value)} // Update selected groups
              >
                {tempGroups.map((tp) => (
                  <Select.Option key={tp?._id} value={tp?.groupName}>
                    {tp?.groupName}
                  </Select.Option>
                ))}
              </Select>
            </Col>
          </Row>
          <Row
            gutter={[32, 16]}
            style={{
              maxHeight: "34rem",
              overflowY: "auto",
              padding: "1.2rem 0px",
            }}
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
                  <Col xs={24} sm={24} md={18} lg={8} key={groupKey}>
                    <Card
                      extra={
                        <Dropdown
                          trigger={["click"]}
                          overlay={
                            <Menu>
                              <Menu.Item
                                key="1"
                                icon={
                                  <FileSearchOutlined
                                    style={{ fontSize: "1rem" }}
                                  />
                                }
                                onClick={() => handleOpenDrawer(groupKey)}
                              >
                                <p style={{ padding: "0px", margin: "0px" }}>
                                  Xem chi tiết
                                </p>
                              </Menu.Item>
                              <Menu.SubMenu
                                key="2"
                                icon={
                                  <PlusCircleOutlined
                                    style={{ fontSize: "1rem" }}
                                  />
                                }
                                title={
                                  <p style={{ padding: "0px", margin: "0px" }}>
                                    Thêm thành viên
                                  </p>
                                }
                              >
                                <Menu.Item
                                  onClick={handleOpenAddByDnD}
                                  key="2-1"
                                  icon={
                                    <DragOutlined
                                      style={{ fontSize: "1rem" }}
                                    />
                                  }
                                  disabled={dndActive}
                                >
                                  Thêm bằng kéo thả
                                </Menu.Item>
                                <Menu.Item
                                  onClick={() =>
                                    handleOpenModal(
                                      groupKey,
                                      maxStudent,
                                      currentStudentCount
                                    )
                                  }
                                  key="2-2"
                                  icon={
                                    <EditOutlined
                                      style={{ fontSize: "1rem" }}
                                    />
                                  }
                                >
                                  Thêm bằng chọn danh sách
                                </Menu.Item>
                              </Menu.SubMenu>
                            </Menu>
                          }
                          placement="bottom"
                          arrow
                        >
                          <Tooltip title="Tùy chỉnh thẻ">
                            <FormOutlined
                              style={{
                                fontSize: "1.5rem",
                                color: "#FFF",
                                cursor: "pointer",
                              }}
                            />
                          </Tooltip>
                        </Dropdown>
                      }
                      title={<div className="card-groupname">{groupKey}</div>}
                      bodyStyle={{ padding: "0px" }}
                      headStyle={{
                        background:
                          "rgb(43,144,214) linear-gradient(322deg, rgba(43,144,214,1) 44%, rgba(7,137,223,0.804359243697479) 70%, rgba(53,131,180,1) 85%, rgba(13,123,185,0.9097222222222222) 96%)",
                      }}
                      style={{ width: "18rem" }}
                      bordered
                      className="card-groupstudents"
                    >
                      {/* Dropzone to accept drops */}
                      <Dropzone
                        id={`${groupKey}`}
                        onDrop={(event) => {
                          const droppedItemId =
                            event.dataTransfer.getData("text/plain");
                          // Process the dropped item
                          handleDrop(droppedItemId, groupKey); // handleDrop function to manage the state update
                        }}
                      >
                        {users.length > 0 ? (
                          <List
                            bordered
                            dataSource={[users[0]]} // Only show the first item
                            renderItem={(item) => (
                              <div
                                key={item._id}
                                style={{
                                  padding: "8px",
                                }}
                              >
                                <span style={{ fontWeight: "600" }}>
                                  {" "}
                                  Thành viên:{" "}
                                </span>
                                <span
                                  style={{
                                    color:
                                      currentStudentCount < maxStudent
                                        ? "red"
                                        : "green",
                                    fontWeight: "500",
                                  }}
                                >
                                  {currentStudentCount}
                                </span>
                                /
                                <span style={{ fontWeight: "500" }}>
                                  {maxStudent}{" "}
                                  <UserOutlined style={{ fontWeight: "500" }} />
                                </span>
                                <div style={{ fontWeight: "600" }}>
                                  Chuyên ngành học: <Tag>SE</Tag>
                                  <Tag>MKT</Tag>
                                </div>
                              </div>
                            )}
                          />
                        ) : (
                          <Empty
                            description="Chưa có ai trong nhóm này"
                            style={{ padding: "20px" }}
                          />
                        )}
                      </Dropzone>

                      <div
                        className="cardbody-numberstudent"
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        <span>Tình trạng nhóm: </span>
                        {currentStudentCount < maxStudent ? (
                          <span style={{ color: "red" }}>
                            Chưa đủ thành viên
                          </span>
                        ) : (
                          <span style={{ color: "green" }}>
                            Đã đủ thành viên
                          </span>
                        )}
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
              // width: "fit-content",
              cursor: "grab",
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
            </div>
          </div>
        ) : null}
      </DragOverlay>
      <AddStudent
        groupKey={drawerGroupKey}
        maxStudent={maxStudentInGroup}
        currentStudents={currentStudentsInGroup}
        show={isShowModal}
        close={handleCloseModal}
      />

      <Drawer
        title={`Danh sách thành viên - ${drawerGroupKey}`}
        onClose={handleCloseDrawer}
        open={isOpenDrawer}
        bodyStyle={{ padding: "0px" }}
        width={420}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "5px",
            marginBottom: "10px",
          }}
        >
          <Select
            mode="multiple"
            maxCount={6}
            placeholder="Chuyên ngành"
            onChange={(value) => setSelectedGroups(value)}
            style={{ width: "8rem" }}
          >
            {tempGroups.map((tp) => (
              <Select.Option key={tp?._id} value={tp?.groupName}>
                {tp?.groupName}
              </Select.Option>
            ))}
          </Select>
          <div style={{ width: "15rem" }}>
            <Search
              placeholder="Nhập tên, email hoặc MSSV"
              onChange={(e) => setTempGroupSearchText(e.target.value)}
            />
          </div>
        </div>
        <List
          bordered
          dataSource={
            drawerGroupKey ? filteredGroupUsers(data[drawerGroupKey]) : []
          }
          renderItem={(item) => (
            <List.Item key={item._id} className="list-drawer">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-evenly",
                  width: "14rem",
                  alignItems: "center",
                }}
              >
                <Avatar src={avatarImage} />
                <div style={{ lineHeight: "1rem" }}>
                  <div style={{ fontWeight: "700" }}>{item.username}</div>
                  <div>{item.email}</div>
                  <div>MSSV: {item.rollNumber}</div>
                </div>
              </div>
              <Popconfirm
                title={`Bạn có chắc chắn cho ${item.username} rời nhóm không?`}
                onConfirm={() => handleRemoveUser(item._id)}
                okText="Có"
                cancelText="Không"
              >
                <Button color="danger" variant="outlined">
                  Rời nhóm
                </Button>
              </Popconfirm>
            </List.Item>
          )}
        />
      </Drawer>
    </DndContext>
  );
};

export default SortableCards;
