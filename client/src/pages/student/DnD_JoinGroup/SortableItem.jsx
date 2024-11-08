import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { List, Avatar, Empty } from "antd";
import { CiMail } from "react-icons/ci";
import { StarOutlined } from "@ant-design/icons"; // Import star icon
import avatarImage from "../../../assets/images/459233558_122150574488258176_5118808073589257292_n.jpg";

export const SortableItem = ({ id, item, userId }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const itemStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    borderBottom: "1px solid #f0f0f0",
  };

  const contentStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flexGrow: 1,
  };

  const usernameStyle = {
    fontSize: "1.1em",
    fontWeight: "bold",
    lineHeight: "1.2em",
  };

  const detailsStyle = {
    fontSize: "0.9em",
    color: "#666",
    lineHeight: "1.1em",
  };

  // Check if item is a placeholder for an empty state
  if (typeof item === "object" && !item._id) {
    return (
      <List.Item
        ref={setNodeRef}
        style={itemStyle}
        {...attributes}
        {...listeners}
      >
        <Empty
          description="Kéo thả vào để hủy bỏ tham gia nhóm hiện tại"
          style={{
            width: "100%",
            textAlign: "center",
            borderStyle: "dashed",
            margin: "0px",
            padding: "5px",
            border: "0.5px dashed #007F7A"
          }}
        />
      </List.Item>
    );
  }

  // Render custom content if this item represents the current user
  return (
    <List.Item
      ref={setNodeRef}
      style={itemStyle}
      {...attributes}
      {...listeners}
    >
      <Avatar src={avatarImage} style={{ marginRight: "8px" }} />
      <div style={contentStyle} key={item._id}>
        {item._id === userId ? (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={usernameStyle}>{item.username}</div>
              <div style={detailsStyle}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CiMail style={{ fontSize: "1.1rem", marginRight: "4px" }} />
                  {item.email}
                </div>
                <div>MSSV: {item.rollNumber}</div>
              </div>
            </div>
            <StarOutlined
              className={item._id === userId ? "bounce" : ""}
              style={{ fontSize: "1.2rem", color: "gold", marginRight: "8px" }}
            />
          </div>
        ) : (
          <>
            <div style={usernameStyle}>{item.username}</div>
            <div style={detailsStyle}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <CiMail style={{ fontSize: "1.1rem", marginRight: "4px" }} />
                {item.email}
              </div>
              <div>MSSV: {item.rollNumber}</div>
            </div>
          </>
        )}
      </div>
    </List.Item>
  );
};
