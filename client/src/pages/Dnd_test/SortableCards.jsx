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
import { BASE_URL } from "../../utilities/initalValue";
import {
  setTempGroups,
  setTotalTempGroups,
  setTotalWaitUsers,
  setWaitUserList,
} from "../../redux/slice/TempGroupSlice";
import "../../style/Class/ClassDetail.css";
import Search from "antd/es/transfer/search";
import { UserOutlined } from "@ant-design/icons";

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

  const [classId, setClassId] = useState(null);
  const [data, setData] = useState({});
  const [previousData, setPreviousData] = useState({});
  const [dropTargetCard, setDropTargetCard] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const [searchText, setSearchText] = useState("");
  //Phân trang
  const [currentPage, setCurrentPage] = useState(1);
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
          `${BASE_URL}/class/className/SE1714-NJ`,
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

  // Fetch Groups Data
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

  console.log("group yet: " + JSON.stringify(tempGroups));
  console.log("Ungroup yet: " + JSON.stringify(waitUserList));

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

  // Handle Confirm Changes
  const handleConfirm = async () => {
    setIsConfirming(false);
    try {
      const groupRequests = Object.entries(data).map(([groupName, users]) => {
        const groupId = tempGroups.find(
          (group) => group.groupName === groupName
        )?._id;
        return axios.put(
          `${BASE_URL}/tempgroup/${groupId}`,
          { userIds: users.map((user) => user._id) },
          config
        );
      });

      await Promise.all(groupRequests);
      message.success("Cập nhật thành công!");

      // Update Redux with the latest data
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
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
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

    const activeId = active.id.split("-")[1];
    const overId = over.id.split("-")[1];
    const activeContainer =
      Object.keys(data).find((key) =>
        data[key].some((item) => item._id.toString() === activeId)
      ) || "waitUserList";
    const overContainer =
      Object.keys(data).find((key) =>
        data[key].some((item) => item._id.toString() === overId)
      ) || over.id.split("-")[0];

    // Check if we're moving from `waitUserList` to a group in `tempGroups`
    if (
      activeContainer === "waitUserList" &&
      overContainer !== "waitUserList"
    ) {
      const activeItems = waitUserList.filter((item) => item._id !== activeId);
      const overItems = [...data[overContainer], activeItem];

      setData((prev) => ({
        ...prev,
        [overContainer]: overItems,
      }));
      dispatch(setWaitUserList(activeItems));
      setDropTargetCard(overContainer);
      setIsConfirming(true);
    } else if (
      activeContainer !== "waitUserList" &&
      overContainer === "waitUserList"
    ) {
      // Moving from a group to `waitUserList`
      const sourceItems = data[activeContainer].filter(
        (item) => item._id !== activeId
      );
      const updatedWaitUserList = [...waitUserList, activeItem];

      setData((prev) => ({
        ...prev,
        [activeContainer]: sourceItems,
      }));
      dispatch(setWaitUserList(updatedWaitUserList));
      setDropTargetCard("waitUserList");
      setIsConfirming(true);
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
        <Col sm={6}>
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

          {totalWaitUsers > 0 ? (
            <SortableContext
              items={filteredUsers.map((user) => `waitUserList-${user._id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div
                className="list-container-groupstudent"
                style={{ width: "100%" }}
              >
                {filteredUsers.map((user) => (
                  <SortableItem
                    key={user._id}
                    id={`waitUserList-${user._id}`}
                    item={user}
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            <Empty description="Chưa có sinh viên nào trong danh sách chờ" />
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
        </Col>

        <Col sm={18}>
          <Row gutter={[32, 16]}>
            {sortedGroupKeys.map((groupKey) => {
              // Find the maximum student capacity for the group
              const maxStudent = tempGroups.find(
                (group) => group.groupName === groupKey
              )?.maxStudent;
              const currentStudentCount = data[groupKey]?.length || 0;

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
                      disabled={isConfirming}
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
                        <Popconfirm
                          title="Bạn có chắc chắn muốn thực hiện thay đổi này không?"
                          onConfirm={handleConfirm}
                          onCancel={handleCancel}
                          visible={dropTargetCard === groupKey && isConfirming}
                          okText="Yes"
                          cancelText="No"
                        >
                          <List
                            bordered
                            dataSource={data[groupKey]}
                            renderItem={(item) => (
                              <SortableItem
                                id={`${groupKey}-${item._id}`}
                                item={item}
                              />
                            )}
                          />
                        </Popconfirm>
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
                            currentStudentCount < maxStudent - 1
                              ? "red"
                              : currentStudentCount === maxStudent - 1 ||
                                currentStudentCount === maxStudent
                              ? "green"
                              : "black",
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
              src={activeItem.avatar}
              size={24}
              style={{ marginRight: "8px" }}
            />
            <span>{activeItem.username}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SortableCards;
