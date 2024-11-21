// src/components/layout/AppHeader.js
import React from "react";
import { Layout } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import "../../style/Admin/AdminHeader.css";
const { Header } = Layout;

const AdminHeader = ({ content, style }) => {
  return <h3 className="admin-header">{content}</h3>;
};

export default AdminHeader;
