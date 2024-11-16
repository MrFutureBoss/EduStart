import { PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React from "react";

const AddButton = ({ content, onClick, disable }) => {
  return (
    <Button
      style={{ height: "2.2rem" }}
      color="primary"
      variant="solid"
      disable={disable}
      onClick={onClick}
    >
      <PlusOutlined />
      {content}
    </Button>
  );
};
export default AddButton;
