import React from "react";
import SortableCards from "./SortableCards.jsx";

const Result2 = ({dndActive}) => {
  return (
    <div style={{ padding: "24px" }}>
      <SortableCards dndActive={dndActive} />
    </div>
  );
};

export default Result2;
