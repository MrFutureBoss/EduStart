import React from "react";
import "../../style/components/button/Button.css";

const CustomButton = ({
  color,
  type,
  content,
  disable,
  style,
  onClick,
  icon,
}) => {
  return (
    <button
      style={style}
      onClick={onClick}
      className="custum-button"
      color={color}
      type={type}
      disable={disable}
    >
      {icon}
      {content}
    </button>
  );
};
export default CustomButton;
