import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { Card, List, Empty, message, Popconfirm, Avatar, Row, Col } from "antd";
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
} from "../../redux/slice/TempGroupSlice";
import "../../style/Class/ClassDetail.css";

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

  const tempGroups = useSelector((state) => state.tempGroup.data || []);

  // Handle Confirm Changes
  const handleConfirm = async () => {
    setIsConfirming(false);
    try {
      const updatedGroup = Object.entries(data).find(
        ([key, _]) => key === dropTargetCard
      );

      if (updatedGroup) {
        const [groupName, users] = updatedGroup;
        const targetGroupId = Object.values(tempGroups).find(
          (group) => group.groupName === groupName
        )?._id;

        // Find the original group containing the moved item
        const previousGroupName = Object.keys(previousData).find((group) =>
          previousData[group].some((user) =>
            users.some((newUser) => newUser._id === user._id)
          )
        );
        const previousGroupId = Object.values(tempGroups).find(
          (group) => group.groupName === previousGroupName
        )?._id;

        // Check if target group is the same as previous group
        if (previousGroupId !== targetGroupId) {
          // Remove the moved item from the previous group
          if (previousGroupId) {
            const remainingUsers = previousData[previousGroupName].filter(
              (user) => !users.some((newUser) => newUser._id === user._id)
            );
            await axios.put(
              `${BASE_URL}/tempgroup/${previousGroupId}`,
              { userIds: remainingUsers.map((user) => user._id) },
              config
            );
          }

          // Update the target group with the new list of users
          await axios.put(
            `${BASE_URL}/tempgroup/${targetGroupId}`,
            { userIds: users.map((user) => user._id) },
            config
          );
        }

        // Update previousData to match the latest data
        setPreviousData(data);
        setDropTargetCard(null);
        message.success("Thay đổi đã được xác nhận.");
      }
    } catch (error) {
      console.error("Error updating group:", error);
      message.error("Cập nhật không thành công.");
      setData(previousData); // Revert changes if the update fails
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
    const item = Object.values(data)
      .flat()
      .find((i) => i._id.toString() === activeId);

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

    const activeContainer = Object.keys(data).find((key) =>
      data[key].some((item) => item._id.toString() === activeId)
    );
    const overContainer =
      Object.keys(data).find((key) =>
        data[key].some((item) => item._id.toString() === overId)
      ) || over.id.split("-")[0];

    if (!data[activeContainer] || !data[overContainer]) return;

    if (activeContainer === overContainer) {
      const items = [...data[activeContainer]];
      const activeIndex = items.findIndex(
        (item) => item._id.toString() === activeId
      );
      const [movedItem] = items.splice(activeIndex, 1);
      const overIndex = items.findIndex(
        (item) => item._id.toString() === overId
      );
      items.splice(overIndex, 0, movedItem);

      setData((prev) => ({ ...prev, [activeContainer]: items }));
      return;
    }

    const activeItems = [...data[activeContainer]];
    const overItems = [...data[overContainer]];

    const activeIndex = activeItems.findIndex(
      (item) => item._id.toString() === activeId
    );
    const [movedItem] = activeItems.splice(activeIndex, 1);
    overItems.push(movedItem);

    setData((prev) => ({
      ...prev,
      [activeContainer]: activeItems,
      [overContainer]: overItems,
    }));
    setDropTargetCard(overContainer);
    setIsConfirming(true);
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
                      ? data[groupKey].map((item) => `${groupKey}-${item._id}`)
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
