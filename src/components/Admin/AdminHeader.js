// src/components/layout/AppHeader.js
import React from "react";
import { Layout } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";

const { Header } = Layout;

const AppHeader = ({ collapsed, toggleCollapse }) => {
  return (
    <Header
      className="header"
      style={{
        background: "#002140",
        padding: 0,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        className="logo"
        style={{
          color: "#fff",
          paddingLeft: "20px",
          fontSize: "20px",
          flex: 1,
        }}
      >
        Hệ Thống Quản Lý
      </div>
      <div
        onClick={toggleCollapse}
        style={{ paddingRight: "20px", cursor: "pointer" }}
      >
        {collapsed ? (
          <MenuUnfoldOutlined style={{ color: "#fff", fontSize: "20px" }} />
        ) : (
          <MenuFoldOutlined style={{ color: "#fff", fontSize: "20px" }} />
        )}
      </div>
    </Header>
  );
};

export default AppHeader;
