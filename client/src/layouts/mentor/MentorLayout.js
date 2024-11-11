import React, { useState } from "react";
import { Content } from "antd/es/layout/layout";
import { Breadcrumb, Layout } from "antd";
import { Link, Outlet } from "react-router-dom";
import MentorHeader from "./MentorHeader";
import MentorSidebar from "./MentorSidebar";

const MentorLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#F5F5F5" }}>
      <MentorHeader collapsed={collapsed} toggleCollapse={toggleCollapse} />
      <Layout style={{ backgroundColor: "#F5F5F5" }}>
        <MentorSidebar collapsed={collapsed} toggleCollapse={toggleCollapse} />
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

export default MentorLayout;
