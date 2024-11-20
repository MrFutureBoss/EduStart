import React from "react";
import "../../style/components/button/Button.css";

const ConfirmButton = ({ key, content, onClick, disabled }) => {
  return (
    <button className="confirm-button" key={key} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
};
export default ConfirmButton;
