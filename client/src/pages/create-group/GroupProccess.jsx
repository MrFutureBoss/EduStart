import { Button, message, Steps, theme } from "antd";
import React, { useState } from "react";
import UnGroupList from "./UnGroupList";
import { IoChevronBackOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const GroupProccess = () => {
  const [current, setCurrent] = useState(0);
  const steps = [
    {
      title: "Tạo nhóm",
      description: "Thời gian còn lại: 10 ngày",
      content: {},
      // subTitle: "05-08-2024",
    },
    {
      title: "Ghép nhóm với mentor",
      content: "Second-content",
      subTitle: "14-08-2024",
    },
    {
      title: "Quản lí nhóm",
      content: "Last-content",
    },
  ];
  const next = () => {
    setCurrent(current + 1);
  };
  const prev = () => {
    setCurrent(current - 1);
  };
  const items = steps.map((item) => ({
    key: item.title,
    title: item.title,
    subTitle: item.subTitle,
    description: item.description,
  }));
  const navigate = useNavigate();

  const handleMoveBackToClassManagement = () => {
    navigate("/teacher-dashboard/class");
  };

  return (
    <div>
      <Button onClick={() => handleMoveBackToClassManagement()}>
        <IoChevronBackOutline /> Quay lại quản lí lớp
      </Button>
      <div
        style={{
          margin: "40px 0px",
        }}
      >
        <>
          <UnGroupList />
        </>
      </div>
    </div>
  );
};

export default GroupProccess;
