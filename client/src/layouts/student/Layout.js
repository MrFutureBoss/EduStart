// src/components/StudentLayout.js
import React, { useState } from "react";
import { Layout } from "antd";
import Navbar from "./StudentHeader"; // Đổi Header thành Navbar cuộn
import { Outlet } from "react-router-dom";
import StudentHeader from "./StudentHeader";
import StudentSidebar from "./StudentSidebar";

const { Content } = Layout;

const StudentLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        backgroundColor: "#F5F5F5",
      }}
    >
      <StudentHeader />
      <Layout style={{ backgroundColor: "#F5F5F5", marginTop: 50 }}>
        <StudentSidebar collapsed={collapsed} toggleCollapse={toggleCollapse} />
        <Layout
          style={{
            backgroundColor: "#F5F5F5",
            overflow: "auto",
          }}
        >
          <Content
            className="site-layout-background"
            style={{
              padding: 20,
              overflowX: "hidden",
              minHeight: 280,
              background: "#F5F5F5",
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

export default StudentLayout;
