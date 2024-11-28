import React from "react";

const UpdateButton = ( {key, content, onClick, disabled, style }) => {
  return (
    <button
      style={style}
      className="update-button"
      key={key}
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </button>
  );
};

export default UpdateButton;
