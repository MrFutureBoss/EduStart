import React, { useState } from "react";
import MainLayout from "../../components/Admin/AdminMain";
import { Content } from "antd/es/layout/layout";
import { Breadcrumb, Layout } from "antd";
import TeacherHeader from "./TeacherHeader";
import TeacherSider from "./TeacherSidebar";
import { Link, Outlet } from "react-router-dom";
import TeacherNotification from "../../components/Notification/TeacherNotification";

const TeacherLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#F5F5F5" }}>
      <TeacherHeader collapsed={collapsed} toggleCollapse={toggleCollapse} />
      <Layout style={{ backgroundColor: "#F5F5F5" }}>
        <TeacherSider collapsed={collapsed} toggleCollapse={toggleCollapse} />
        <TeacherNotification
          type="error"
          title="Có 1 lớp chưa được tạo nhóm"
          description={<Link to="class">Bấm vào đây để xem chi tiết</Link>}
          triggerNotification={showNotification}
        />
        <TeacherNotification
          type="warning"
          title="Sắp tới thời gian outcome"
          description={<Link to="class#outcome-management">Bấm vào đây để thêm ngay</Link>}
          triggerNotification={showNotification}
        />
        <Layout
          style={{
            padding: "0 24px 24px",
            backgroundColor: "#F5F5F5",
            overflow: "auto",
          }}
        >
          <Breadcrumb
            items={[{ title: "Home" }, { title: "List" }, { title: "App" }]}
            style={{ margin: "16px 0" }}
          />
          <Content
            className="site-layout-background"
            style={{
              padding: 30,
              margin: "24px 16px 0",
              overflow: "initial",
              minHeight: 280,
              background: "#FFF",
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default TeacherLayout;
