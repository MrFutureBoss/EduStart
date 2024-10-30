import { Col, Row } from "antd";
import React from "react";
import { GrGroup } from "react-icons/gr";
import { FaRegCalendar } from "react-icons/fa";
import { CiWarning } from "react-icons/ci";

const TeacherTask = () => {
  return (
    <Row gutter={[32, 16]}>
      {/* Task cần làm */}
      <Col xs={24} sm={12} md={12} lg={12} xl={12}>
        <Row className="class-management-card priorityhigh" gutter={[16, 16]}>
          <Col xs={24} style={{ padding: "0px" }}>
            {/* Upper Content */}
            <Row className="content">
              <Col xs={24} md={16} sm={16}>
                <Row className="data-value">
                  <p>1</p>
                </Row>
                <Row className="title">
                  <p>Lớp chưa được tạo nhóm</p>
                </Row>
              </Col>
              <Col xs={24} md={8} sm={8} className="icon-position">
                <CiWarning style={{color:'#FF5252', fontWeight:'600'}}/>
              </Col>
            </Row>
            {/* Footer Content */}
            <Row className="footer red-card">
              <p>Bấm vào để xem chi tiết</p>
            </Row>
          </Col>
        </Row>
      </Col>
      {/* Số nhóm chưa có đủ thành viên */}
      <Col xs={24} sm={12} md={12} lg={12} xl={12}>
        <Row className="class-management-card" gutter={[16, 16]}>
          <Col xs={24} style={{ padding: "0px" }}>
            {/* Upper Content */}
            <Row className="content">
              <Col xs={24} md={16} sm={16}>
                <Row className="data-value">
                  <p style={{ color: "#FFBA57" }}>2</p>
                </Row>
                <Row className="title">
                  <p>Lớp chưa chốt nhóm xong</p>
                </Row>
              </Col>
              <Col xs={24} md={8} sm={8} className="icon-position">
                <GrGroup />
              </Col>
            </Row>
            {/* Footer Content */}
            <Row className="footer yellow-card">
              <p>Bấm vào để xem chi tiết</p>
            </Row>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default TeacherTask;
