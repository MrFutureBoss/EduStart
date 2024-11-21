import { Col, Row } from "antd";
import React from "react";
import CustomCalendar from "./MeetingSchedule";

const ManageMeetingTime = () => {
  return (
    <Row gutter={[12, 16]}>
      <Col span={18}>
        <CustomCalendar />
      </Col>
      <Col span={6}><p>HHH</p></Col>
    </Row>
  );
};

export default ManageMeetingTime;
