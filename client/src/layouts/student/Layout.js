// src/components/StudentLayout.js
import React from "react";
import { Layout } from "antd";
import Navbar from "./Navbar"; // Đổi Header thành Navbar cuộn
import { Outlet } from "react-router-dom";

const { Content } = Layout;

const StudentLayout = () => (
  <Layout style={{ minHeight: "100vh" }}>
    <Navbar />
    <Layout>
      <Content
        style={{
          backgroundColor: "rgb(252 252 252)",
          padding: "50px 30px 20px 30px",
        }}
      >
        <Outlet /> {/* Nội dung route con */}
      </Content>
    </Layout>
  </Layout>
);

export default StudentLayout;
