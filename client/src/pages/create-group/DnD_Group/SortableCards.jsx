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
  setTotalWaitUsers,
  setWaitUserList,
} from "../../../redux/slice/TempGroupSlice";
import "../../../style/Class/ClassDetail.css";
import Search from "antd/es/transfer/search";
import { useParams } from "react-router-dom";
import avatarImage from "../../../assets/images/459233558_122150574488258176_5118808073589257292_n.jpg";
import Highlighter from "react-highlight-words";

const SortableCards = ({ dndActive }) => {
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
  }, [config]);

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

  const tempGroups = useSelector((state) => state.tempGroup.data || []);
  const waitUserList = useSelector(
    (state) => state.tempGroup.waituserlist || []
  );
  const totalWaitUsers = useSelector((state) => state.tempGroup.waittotal || 0);

  // console.log("group yet: " + JSON.stringify(tempGroups));
  // console.log("Ungroup yet: " + JSON.stringify(waitUserList));

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

  // Handle Confirm Changes
  const handleConfirm = async () => {
    try {
      // Only update actual groups in the database, ignoring `waitUserList`
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

      // Update Redux with the latest groups data
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
      setIsConfirming(false); // Ensure Popconfirm is closed
      setIsWaitListConfirming(false);
    }
  };

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
    // Fetch updated waitUserList data only
    const waitListResponse = await axios.get(
      `${BASE_URL}/class/ungroup/${classId}`,
      config
    );

    // Update Redux with the latest waitUserList
    dispatch(setWaitUserList(waitListResponse.data.data));
    dispatch(setTotalWaitUsers(waitListResponse.data.total));

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
      {" "}
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
              <Tooltip title={dndActive ? "Giữ và kéo để thao tác" : ""}>
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
                placeholder="Chọn các nhóm để xem thông tin"
                style={{ width: "16rem" }}
                onChange={(value) => setSelectedGroups(value)} // Update selected groups
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
                      title={<div className="card-groupname">{groupKey}</div>}
                      bodyStyle={{ padding: "0px" }}
                      headStyle={{
                        background:
                          "linear-gradient(-45deg, #005241, #128066, #00524f, #008d87)",
                        color: "white",
                      }}
                      style={{ width: "18rem" }}
                      bordered
                      className="card-groupstudents"
                    >
                      <SortableContext
                        disabled={
                          !dndActive || isConfirming || isWaitListConfirming
                        }
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
                          <Tooltip
                            title={dndActive ? "Giữ và kéo để thao tác" : ""}
                          >
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
                                  >
                                    {" "}
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
                              <Empty
                                description="Chưa có ai trong nhóm này"
                                style={{ padding: "20px" }}
                              />
                            }
                          />
                        )}
                      </SortableContext>

                      {/* Footer div for showing student count */}
                      <div
                        className="cardbody-numberstudent"
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
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
