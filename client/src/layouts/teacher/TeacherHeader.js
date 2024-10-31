// src/components/layout/AppHeader.js
import React from "react";
import { Layout } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";

const { Header } = Layout;

const TeacherHeader = ({ collapsed, toggleCollapse }) => {
  return (
    <Header
      className="header"
      style={{
        background: "linear-gradient(-45deg, #005241, #128066, #00524f",
        padding: 0,
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
      }}
    >
      <div
        className="logo"
        style={{
          color: "#fff",
          paddingLeft: "20px",
          fontSize: "20px",
        }}
      >
        Hệ Thống Quản Lý
      </div>
      {/* <div
        onClick={toggleCollapse}
        style={{ paddingRight: "20px", cursor: "pointer" }}
      >
        {collapsed ? (
          <MenuUnfoldOutlined style={{ color: "#fff", fontSize: "20px" }} />
        ) : (
          <MenuFoldOutlined style={{ color: "#fff", fontSize: "20px" }} />
        )}
      </div> */}
    </Header>
  );
};

export default TeacherHeader;
