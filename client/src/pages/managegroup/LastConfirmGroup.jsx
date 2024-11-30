import React, { useEffect, useMemo, useState } from "react";
import SmallModal from "../../components/Modal/SmallModal";
import { Alert, Button, Checkbox, Col, message, Popconfirm, Row, Tooltip } from "antd";
import { SettingOutlined, StopOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { BASE_URL } from "../../utilities/initalValue";
import axios from "axios";

const LastConfirmGroup = ({ close, show }) => {
  const dispatch = useDispatch();
  const { className } = useParams();
  const [classId, setClassId] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const jwt = localStorage.getItem("jwt");

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  // Fetch Class ID
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/className/${className}`,
          config
        );
        setClassId(response.data?.classId);
      } catch (error) {
        console.error(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [config, className]);

  const handleUnlockManageGroup = async () => {
    try {
      // Thực hiện POST đầu tiên
      const firstPostResponse = await axios.post(
        `${BASE_URL}/tempgroup/offical-group/${classId}`,
        config
      );
  
      if (firstPostResponse.status === 200) {
        // Nếu POST đầu tiên thành công, thực hiện POST thứ hai
        const secondPostResponse = await axios.post(
          `${BASE_URL}/tempgroup/students/${classId}`,
          config
        );
  
        if (secondPostResponse.status === 200) {
          message.success("Đã mở khóa chức năng quản lý nhóm!");
          window.location.reload();
        } else {
          message.error("Đã xảy ra lỗi khi gửi dữ liệu đến nhóm học sinh!");
        }
      } else {
        message.error("Không thể tạo nhóm chính thức!");
      }
    } catch (error) {
      console.error("Error during unlock:", error);
      message.error("Đã xảy ra lỗi trong quá trình mở khóa quản lý nhóm!");
    }
  };
  

  const modalBody = (
    <Row
      style={{
        padding: "1rem",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
      }}
    >
      <Col
        span={24}
        style={{
          maxWidth: "600px", // Giới hạn chiều rộng của nội dung
        }}
      >
        <Row style={{ marginBottom: "1rem" }}>
        <SettingOutlined style={{ color: "#333", marginRight: "8px", fontSize: "16px" }} />
          <p
            style={{
              margin: "0px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Hệ thống ngẫu nhiên chọn một nhóm trưởng cho các nhóm
          </p>
          <small style={{ color: "#888", fontStyle: "italic"}}>
            * Các nhóm vẫn có thể chọn lại nhóm trưởng
          </small>
        </Row>
        <Row style={{ marginBottom: "1.5rem" }}>
        <SettingOutlined style={{ color: "#333", marginRight: "8px", fontSize: "16px" }} />
          <p
            style={{
              margin: "0px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Hệ thống gửi thông báo cho các nhóm bắt đầu chốt đề tài
          </p>
        </Row>
        <Row justify="center">
          <Alert
            message="Tuy nhiên bạn sẽ không thể tùy chỉnh lại nhóm nữa"
            type="warning"
            showIcon
            style={{
              borderRadius: "8px",
              fontWeight: "400",
              fontSize: "14px",
              backgroundColor: "#fff6e6",
              color: "#ff9800",
              border: "1px solid #ff9800",
              textAlign: "left", // Giữ chữ căn trái
              maxWidth: "100%", // Đảm bảo không bị tràn
            }}
          />
        </Row>
      </Col>
    </Row>
  );
  

  const modalFooter = (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        justifyContent: "end",
        alignItems: "center",
      }}
    >
      <div>
        <Checkbox onChange={(e) => setIsChecked(e.target.checked)}>
          <p style={{ margin: "0px" }}>Tôi đồng ý</p>
        </Checkbox>
      </div>

      <Button color="primary" variant="solid" disabled={!isChecked} onClick={handleUnlockManageGroup}>
        Bắt đầu
      </Button>

      <Button onClick={close} color="danger" variant="solid">
        Suy nghĩ lại
      </Button>
    </div>
  );

  return (
    <div>
      <SmallModal
        title={
          <h5>
            <span style={{ fontWeight: "500" }}>
              Bắt đầu đi đến quản lý nhóm
            </span>
          </h5>
        }
        content={modalBody}
        footer={modalFooter}
        isModalOpen={show}
        handleCancel={close}
        closeable={true}
      ></SmallModal>
    </div>
  );
};

export default LastConfirmGroup;
