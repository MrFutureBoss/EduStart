import React, { useState } from "react";
import { Content } from "antd/es/layout/layout";
import { Outlet } from "react-router-dom";
import { Layout } from "antd";
import MentorSidebar from "./MentorSidebar";
import MentorHeader from "./MentorHeader";

const MentorLayout = () => {
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
      <MentorHeader />
      <Layout style={{ backgroundColor: "#F5F5F5", marginTop: 50 }}>
        <MentorSidebar collapsed={collapsed} toggleCollapse={toggleCollapse} />
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
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MentorLayout;
