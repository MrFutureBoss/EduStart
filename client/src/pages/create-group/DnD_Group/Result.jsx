import React from "react";
import SortableCards from "./SortableCards.jsx";

const Result = ({ className }) => {
  return (
    <div style={{ padding: "24px" }}>
      <SortableCards className={className} />
    </div>
  );
};

export default Result;
