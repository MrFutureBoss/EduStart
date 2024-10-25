// import React, { useState } from "react";
// import { Card, List } from "antd";
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import { SortableItem } from "./SortableItem";

// const initialData = {
//   card1: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
//   card2: ["Item 6", "Item 7", "Item 8", "Item 9", "Item 10"],
//   card3: ["Item 11", "Item 12", "Item 13", "Item 14", "Item 15"],
//   card4: ["Item 16", "Item 17", "Item 18", "Item 19", "Item 20"],
// };

// const SortableCards = () => {
//   const [data, setData] = useState(initialData);

//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor)
//   );

//   const onDragEnd = ({ active, over }) => {
//     if (!over) return;

//     const [activeContainer, activeIndex] = active.id.split("-");
//     const [overContainer, overIndex] = over.id.split("-");

//     if (activeContainer !== overContainer) {
//       // Move item to a different card
//       const activeItems = [...data[activeContainer]];
//       const overItems = [...data[overContainer]];

//       const [movedItem] = activeItems.splice(activeIndex, 1);
//       overItems.splice(overIndex, 0, movedItem);

//       setData((prev) => ({
//         ...prev,
//         [activeContainer]: activeItems,
//         [overContainer]: overItems,
//       }));
//     } else {
//       // Move item within the same card
//       const items = [...data[activeContainer]];
//       setData((prev) => ({
//         ...prev,
//         [activeContainer]: arrayMove(items, activeIndex, overIndex),
//       }));
//     }
//   };

//   return (
//     <DndContext
//       sensors={sensors}
//       collisionDetection={closestCenter}
//       onDragEnd={onDragEnd}
//     >
//       <div style={{ display: "flex", gap: "16px" }}>
//         {Object.keys(data).map((cardKey) => (
//           <Card title={`Card ${cardKey}`} key={cardKey} style={{ width: 250 }}>
//             <SortableContext
//               items={data[cardKey].map((_, index) => `${cardKey}-${index}`)}
//               strategy={verticalListSortingStrategy}
//             >
//               <List
//                 bordered
//                 dataSource={data[cardKey]}
//                 renderItem={(item, index) => (
//                   <SortableItem
//                     id={`${cardKey}-${index}`}
//                     item={item}
//                   />
//                 )}
//               />
//             </SortableContext>
//           </Card>
//         ))}
//       </div>
//     </DndContext>
//   );
// };

// export default SortableCards;
