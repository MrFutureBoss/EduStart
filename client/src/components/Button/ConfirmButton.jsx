import React from "react";
import "../../style/components/button/Button.css";

const ConfirmButton = ({ content, onClick, disable, style }) => {
  return (
    <button style={style} className="confirm-button" onClick={onClick}>
      {content}
    </button>
  );
};
export default ConfirmButton;
