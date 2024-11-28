import React, { useState } from "react";
import { Col, Row, Card, Menu, Tooltip } from "antd";
import {
  FileOutlined,
  SwapOutlined,
  TeamOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import AbsentStudent from "./AbsentStudent";
import GroupList from "./GroupList";
import TransferGroup from "./TransferGroup";

const ManageGroup = () => {
  const ACTIONS = {
    LIST: "list",
    REPORT: "report",
    TRANSFER: "transfer",
    ABSENT: "absent",
  };

  // Đặt mặc định là LIST
  const [actionGroup, setGroupAction] = useState(ACTIONS.LIST);

  return (
    <Row
      gutter={[24, 24]}
      style={{
        margin: "0px",
        padding: "10px 0px 10px 0px",
        backgroundColor: "#f7f9fc",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Col
        sx={12}
        sm={12}
        md={6}
        lg={5}
        xxl={5}
        style={{
          display: "flex",
          alignItems: "flex-start",
          maxHeight: " 500px",
          overflowY: "auto",
        }}
      >
        <Card
          bordered={false}
          title="Hành động"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
          }}
          headStyle={{
            borderBottom: "1px solid #d9d9d9",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "18px",
          }}
          bodyStyle={{
            padding: "0px",
          }}
        >
          <Menu
            mode="inline"
            style={{
              border: "none",
              backgroundColor: "transparent",
              padding: "0",
            }}
            defaultSelectedKeys={[ACTIONS.LIST]}
            items={[
              {
                key: ACTIONS.LIST,
                icon: (
                  <TeamOutlined
                    style={{ fontSize: "16px", color: "#1890ff" }}
                  />
                ),
                label: (
                  <Tooltip title="Danh sách nhóm">
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                      }}
                      onClick={() => setGroupAction(ACTIONS.LIST)}
                    >
                      Danh sách nhóm
                    </span>
                  </Tooltip>
                ),
              },
              {
                key: ACTIONS.REPORT,
                icon: (
                  <FileOutlined
                    style={{ fontSize: "16px", color: "#1890ff" }}
                  />
                ),
                label: (
                  <Tooltip title="Xem báo cáo nhóm">
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                      }}
                      onClick={() => setGroupAction(ACTIONS.REPORT)}
                    >
                      Xem báo cáo nhóm
                    </span>
                  </Tooltip>
                ),
              },
              {
                key: ACTIONS.TRANSFER,
                icon: (
                  <SwapOutlined
                    style={{ fontSize: "16px", color: "#1890ff" }}
                  />
                ),
                label: (
                  <Tooltip title="Chuyển nhóm cho sinh viên">
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                      }}
                      onClick={() => setGroupAction(ACTIONS.TRANSFER)}
                    >
                      Đổi nhóm cho sinh viên
                    </span>
                  </Tooltip>
                ),
              },
              {
                key: ACTIONS.ABSENT,
                icon: (
                  <UserDeleteOutlined
                    style={{ fontSize: "16px", color: "#1890ff" }}
                  />
                ),
                label: (
                  <Tooltip title="Đình chỉ sinh viên">
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                      }}
                      onClick={() => setGroupAction(ACTIONS.ABSENT)}
                    >
                      Đình chỉ sinh viên
                    </span>
                  </Tooltip>
                ),
              },
            ]}
          />
        </Card>
      </Col>

      <Col
        sx={12}
        sm={12}
        md={18}
        lg={19}
        xxl={19}
        style={{ height: "570px", maxHeight: "700px", overflowY: "auto" }}
      >
        {actionGroup === ACTIONS.LIST && <GroupList />}
        {/* Uncomment these when the respective components are ready */}
        {/* {actionGroup === ACTIONS.REPORT && <Report />} */}
        {actionGroup === ACTIONS.TRANSFER && <TransferGroup />}
        {actionGroup === ACTIONS.ABSENT && <AbsentStudent />}
      </Col>
    </Row>
  );
};

export default ManageGroup;
