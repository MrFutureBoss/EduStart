import React, { useState } from "react";
import MainLayout from "../../components/Admin/AdminMain";
import { Content } from "antd/es/layout/layout";
import { Breadcrumb, Layout } from "antd";
import TeacherHeader from "./TeacherHeader";
import TeacherSider from "./TeacherSidebar";
import { Outlet } from "react-router-dom";
import TeacherDashBoardNotification from "../../notifications/TeacherDashBoardNotification";

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
        <Layout
          style={{
            padding: "0px",
            backgroundColor: "#F5F5F5",
            overflow: "auto",
          }}
        >
          <TeacherDashBoardNotification></TeacherDashBoardNotification>
          <Content
            className="site-layout-background"
            style={{
              padding: 30,
              overflow: "initial",
              minHeight: 280,
              background: "#F5F5F5",
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
