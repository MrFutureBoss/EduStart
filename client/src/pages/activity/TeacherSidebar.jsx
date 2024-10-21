import React from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  BookOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Sider } = Layout;

const TeacherSidebar = ({ collapsed, toggleCollapse }) => {
  const menuItems = [
    {
      key: "1",
      icon: <DashboardOutlined />,
      label: (
        <Link style={{ textDecoration: "none" }} to="/teacher-dashboard">
          Màn hình chính
        </Link>
      ),
    },
    {
      key: "2",
      icon: <UnorderedListOutlined />,
      label: (
        <Link style={{ textDecoration: "none" }} to="/tasks">
          Việc cần làm
        </Link>
      ),
    },
    {
      key: "sub2",
      icon: <FileTextOutlined />,
      label: "Hoạt động chung",
      children: [
        {
          key: "3",
          icon: <BookOutlined />,
          label: (
            <Link style={{ textDecoration: "none" }} to="/posts">
              Bài đăng
            </Link>
          ),
        },
        {
          key: "4",
          icon: <FileDoneOutlined />,
          label: (
            <Link style={{ textDecoration: "none" }} to="/assignments">
              Bài tập
            </Link>
          ),
        },
        {
          key: "5",
          icon: <FileTextOutlined />,
          label: (
            <Link style={{ textDecoration: "none" }} to="/materials">
              Tài liệu chung
            </Link>
          ),
        },
      ],
    },
  ];

  return (
    <Sider
      width={270}
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapse}
      className="site-layout-background"
      style={{
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        overflowY: "auto",
        paddingBottom: 0,
      }}
    >
      <Menu
        mode="inline"
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub2"]}
        items={menuItems}
        style={{ height: "100%", borderRight: 0 }}
      />
    </Sider>
  );
};

export default TeacherSidebar;
