import { Button, message, Steps, theme } from "antd";
import React, { useState } from "react";
import UnGroupList from "./UnGroupList";

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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Steps
          percent={60}
          current={current}
          labelPlacement="vertical"
          items={items}
          style={{ width: "90%" }}
        />
      </div>
      <div
        style={{
          margin: "40px 0px",
        }}
      >
        <>
          <UnGroupList />
        </>
      </div>
      <div
        style={{
          marginTop: 24,
        }}
      >
        {current < steps.length - 1 && (
          <Button type="primary" onClick={() => next()}>
            Next
          </Button>
        )}
        {current === steps.length - 1 && (
          <Button
            type="primary"
            onClick={() => message.success("Processing complete!")}
          >
            Done
          </Button>
        )}
        {current > 0 && (
          <Button
            style={{
              margin: "0 8px",
            }}
            onClick={() => prev()}
          >
            Previous
          </Button>
        )}
      </div>
    </div>
  );
};

export default GroupProccess;
