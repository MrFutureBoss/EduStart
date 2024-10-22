import React, { useState } from "react";
import MainLayout from "../../components/Admin/AdminMain";
import { Content } from "antd/es/layout/layout";
import { Layout } from "antd";
import TeacherHeader from "./TeacherHeader";
import TeacherSidebar from "../../pages/activity/TeacherSidebar";
import TeacherSider from "./TeacherSidebar";

const TeacherLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <TeacherHeader collapsed={collapsed} toggleCollapse={toggleCollapse} />
      <Layout style={{ backgroundColor: "#F7F7F7" }}>
        <TeacherSider
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
        />
        <Layout style={{ paddingRight: "23px", background: "#f0f2f5" }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 30,
              margin: 0,
              minHeight: 280,
              background: "#f0f2f5",
            }}
          >
           
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
  
  ;
};

export default TeacherLayout;
