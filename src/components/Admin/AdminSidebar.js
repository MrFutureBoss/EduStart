import React from "react";
import { Layout, Menu } from "antd";
import {
  UsergroupAddOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Sider } = Layout;

const AppSider = ({
  collapsed,
  currentSemester,
  handleFetchCurrentSemesters,
}) => {
  return (
    <Sider
      width={270}
      collapsible
      collapsed={collapsed}
      className="site-layout-background"
      style={{
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        overflowY: "auto",
      }}
    >
      <Menu
        mode="inline"
        defaultSelectedKeys={["1"]}
        style={{ height: "100%", borderRight: 0, padding: 10 }}
      >
        <Menu.Item key="1" icon={<DashboardOutlined />}>
          <Link style={{ textDecoration: "none" }} to="dashboard">
            Dashboard
          </Link>
        </Menu.Item>
        {currentSemester && (
          <Menu.Item
            key="2"
            icon={<CalendarOutlined />}
            onClick={handleFetchCurrentSemesters}
          >
            Kỳ học hiện tại
          </Menu.Item>
        )}
        {currentSemester && (
          <Menu.Item key="3" icon={<UsergroupAddOutlined />}>
            <Link style={{ textDecoration: "none" }} to="pending-user">
              Sinh viên chưa có lớp
            </Link>
          </Menu.Item>
        )}
        <Menu.Item key="4" icon={<UnorderedListOutlined />}>
          <Link style={{ textDecoration: "none" }} to="semester-list">
            Danh sách kỳ học
          </Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default AppSider;
