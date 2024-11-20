import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { List, Avatar, Empty } from "antd";
import { CiMail } from "react-icons/ci";
import avatarImage from "../../../assets/images/459233558_122150574488258176_5118808073589257292_n.jpg";

export const SortableItem = ({ id, item, cursor }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const itemStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: cursor ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    padding: "8px",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#fff", // Nền trắng cho item
    borderBottom: "1px solid #f0f0f0", // Đường viền dưới cho mỗi item
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
    fontSize: "1.1em", // Larger font for username
    fontWeight: "bold",
    lineHeight: "1.2em", // Single line height for compactness
    marginBottom: "4px", // Space between username and details
  };

  const detailsStyle = {
    fontSize: "0.9em",
    color: "#666",
    lineHeight: "1.1em",
  };

  // Check if item is a placeholder for an empty state
  if (typeof item === "object" && !item._id) {
    // Render Empty component when item is a placeholder
    return (
      <List.Item
        ref={setNodeRef}
        style={itemStyle}
        {...attributes}
        {...listeners}
      >
        <Empty
          description="Chưa có ai trong nhóm này"
          style={{ width: "100%", textAlign: "center" }}
        />
      </List.Item>
    );
  }

  return (
    <List.Item
      ref={setNodeRef}
      style={itemStyle}
      {...attributes}
      {...listeners}
    >
      <Avatar src={avatarImage} style={{ marginRight: "8px" }} />
      <div style={contentStyle} key={item._id}>
        <div style={usernameStyle}>
          {item.username} - <span style={detailsStyle}>{item.rollNumber}</span>
        </div>
        <div style={detailsStyle}>
          <div>
            <span style={{ fontWeight: "500" }}>Chuyên ngành:</span>
            <span
              style={{
                wordWrap: "break-word",
                whiteSpace: "normal",
                maxWidth: "200px",
              }}
            >
              &nbsp;{item.major}
            </span>
          </div>
          <div style={{ display: "flex", textAlign: "center" }}>
            <span style={{ fontWeight: "500" }}>Email:</span>
            &nbsp;{item.email}
          </div>
        </div>
      </div>
    </List.Item>
  );
};
