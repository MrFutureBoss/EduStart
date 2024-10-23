import React, { useState } from "react";
import MainLayout from "../../components/Admin/AdminMain";
import { Content } from "antd/es/layout/layout";
import { Breadcrumb, Layout } from "antd";
import TeacherHeader from "./TeacherHeader";
import TeacherSidebar from "../../pages/activity/TeacherSidebar";
import TeacherSider from "./TeacherSidebar";
import { Outlet } from "react-router-dom";

const TeacherLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

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
            padding: "0 24px 24px",
            backgroundColor: "#F5F5F5",
            overflow: "auto",
             height: "calc(100vh - 64px)"
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
              margin: 0,
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
