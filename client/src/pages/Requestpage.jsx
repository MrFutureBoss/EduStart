import React from "react";
import { Tabs, Layout, Card, Typography } from "antd";
import UserInformationForm from "./UserInformationForm";
import RequestClassChange from "./RequestClassChange";
import GeneralRequestForm from "./GeneralRequestForm"; // Import the new component
import "./Requestpage.css";

const { Title } = Typography;
const { TabPane } = Tabs;

export default function RequestHomepage() {
  const userId = localStorage.getItem("userId");
  const currentClassId = "sample-class-id";

  return (
    <Layout className="layout-container">
      <Card className="request-card">
        <Title level={3} className="card-title">
          Trang Chủ Yêu Cầu
        </Title>
        <Tabs defaultActiveKey="1" centered>
          <TabPane tab="Yêu Cầu Thay Đổi Thông Tin" key="1">
            <UserInformationForm
              userId={userId}
              refreshData={() => console.log("Data refreshed")}
            />
          </TabPane>
          <TabPane tab="Yêu Cầu Đổi Lớp" key="2">
            <RequestClassChange
              currentUserId={userId}
              currentClassId={currentClassId}
              refreshData={() => console.log("Class data refreshed")}
            />
          </TabPane>
          <TabPane tab="Các Yêu Cầu Khác" key="3">
            <GeneralRequestForm
              userId={userId}
              refreshData={() => console.log("General request data refreshed")}
            />
          </TabPane>
        </Tabs>
      </Card>
    </Layout>
  );
}
