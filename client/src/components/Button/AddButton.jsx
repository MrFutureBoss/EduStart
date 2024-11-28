import { PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React from "react";

const AddButton = ({ key, content, onClick, disabled, style }) => {
  return (
    <Button
      style={style}
      color="primary"
      variant="solid"
      disable={disabled}
      onClick={onClick}
      key={key}
    >
      <PlusOutlined />
      {content}
    </Button>
  );
};
export default AddButton;
