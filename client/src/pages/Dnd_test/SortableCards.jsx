import React, { useState } from "react";
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

const initialData = {
  "Nhóm 1": [
    {
      _id: 1,
      mssv: "HE161481",
      username: "username1",
      email: "username1@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Marketing",
    },
    {
      _id: 2,
      mssv: "HE161482",
      username: "username2",
      email: "username2@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Software Engineer",
    },
    {
      _id: 3,
      mssv: "HE161483",
      username: "username3",
      email: "username3@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Media",
    },
    {
      _id: 4,
      mssv: "HE161484",
      username: "username4",
      email: "username4@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Finance",
    },
    {
      _id: 5,
      mssv: "HE161485",
      username: "username5",
      email: "username5@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Human Resources",
    },
  ],
  "Nhóm 2": [
    {
      _id: 6,
      mssv: "HE161486",
      username: "username6",
      email: "username6@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Operations",
    },
    {
      _id: 7,
      mssv: "HE161487",
      username: "username7",
      email: "username7@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Design",
    },
    {
      _id: 8,
      mssv: "HE161488",
      username: "username8",
      email: "username8@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Product Management",
    },
    {
      _id: 9,
      mssv: "HE161489",
      username: "username9",
      email: "username9@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Sales",
    },
    {
      _id: 10,
      mssv: "HE161490",
      username: "username10",
      email: "username10@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Customer Support",
    },
  ],
  "Nhóm 3": [
    {
      _id: 11,
      mssv: "HE161491",
      username: "username11",
      email: "username11@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Legal",
    },
    {
      _id: 12,
      mssv: "HE161492",
      username: "username12",
      email: "username12@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "IT",
    },
    {
      _id: 13,
      mssv: "HE161493",
      username: "username13",
      email: "username13@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Business Development",
    },
    {
      _id: 14,
      mssv: "HE161494",
      username: "username14",
      email: "username14@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Data Science",
    },
    {
      _id: 15,
      mssv: "HE161495",
      username: "username15",
      email: "username15@example.com",
      avatar: "https://joeschmoe.io/api/v1/random",
      subject: "Strategy",
    },
  ],
  "Nhóm 4": [],
};

const SortableCards = () => {
  const [data, setData] = useState(initialData);
  const [previousData, setPreviousData] = useState(initialData);
  const [dropTargetCard, setDropTargetCard] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const onDragStart = ({ active }) => {
    const activeId = active.id.split("-")[1];

    // Check if the item is a placeholder for an empty card
    if (activeId === "empty") {
      return; // Skip drag-start logic for empty placeholders
    }

    // Find the item by _id in data
    const item = Object.values(data)
      .flat()
      .find((i) => i._id.toString() === activeId);

    if (item) {
      setActiveItem(item);
      message.info(`Đang giữ item: ${item.username}`);
    }
  };

  const handleConfirm = () => {
    setIsConfirming(false);
    message.success("Thay đổi đã được xác nhận.");
    setPreviousData(data);
    setDropTargetCard(null);
  };

  const handleCancel = () => {
    setIsConfirming(false);
    message.info("Thay đổi bị hủy bỏ.");
    setData(previousData);
    setDropTargetCard(null);
  };

  const onDragEnd = ({ active, over }) => {
    setActiveItem(null);

    // If there's no valid drop target
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

    // If activeContainer or overContainer is undefined, return early
    if (!data[activeContainer] || !data[overContainer]) {
      return; // Prevents attempting operations on undefined containers
    }

    // Proceed with existing logic if both containers exist
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <Row justify="center">
        {Object.keys(data).map((groupKey) => (
          <Col xs={24} sm={24} md={18} lg={6} key={groupKey}>
            <Card
              title={`${groupKey}`}
              bodyStyle={{ padding: "0px" }}
              style={{ width: "18rem" }}
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
                  // Render SortableItem with Empty as a placeholder for drop target
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
            </Card>
          </Col>
        ))}
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
