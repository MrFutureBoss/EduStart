import React from "react";
import "../../style/components/button/Button.css";

const CancelButton = ({ content, onClick, disable }) => {
  return (
    <button className="cancel-button" onClick={onClick}>
      {content}
    </button>
  );
};
export default CancelButton;
