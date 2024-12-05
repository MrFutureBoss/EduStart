import React from "react";
import "../../style/components/button/Button.css";

const ConfirmButton = ({ key, content, onClick, disabled, style, loading }) => {
  return (
    <button
      style={style}
      className="confirm-button"
      key={key}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </button>
  );
};
export default ConfirmButton;
