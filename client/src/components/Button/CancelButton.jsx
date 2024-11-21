import React from "react";
import "../../style/components/button/Button.css";

const CancelButton = ({ key, content, onClick, disabled, style }) => {
  return (
    <button
      style={style}
      className="cancel-button"
      key={key}
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </button>
  );
};
export default CancelButton;
