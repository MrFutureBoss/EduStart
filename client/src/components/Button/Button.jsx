import { Button } from "antd";
import React from "react";

const CustomButton = ({ color, type, content, disable }) => {
  return (
    <Button color={color} type={type} disable={disable}>
      {content}
    </Button>
  );
};
export default CustomButton;
