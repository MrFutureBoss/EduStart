import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { List } from "antd";

export const SortableItem = ({ id, item }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "move",
  };

  return (
    <List.Item ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {item}
    </List.Item>
  );
};
