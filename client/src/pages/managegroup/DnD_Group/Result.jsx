import React from "react";
import SortableCards from "./SortableCards.jsx";

const Result = ({ dndActive }) => {
  return (
    <div style={{ padding: "24px", overflowX: "auto" }}>
      <SortableCards dndActive={dndActive} />
    </div>
  );
};

export default Result;
