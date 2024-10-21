import React from "react";
import { Layout, Menu } from "antd";
import {
  UsergroupAddOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  DashboardOutlined,
  ScheduleOutlined,
  LogoutOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const { Sider } = Layout;
const { SubMenu } = Menu;

const AppSider = ({
  collapsed,
  currentSemester,
  handleFetchCurrentSemesters,
  toggleCollapse,
}) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/");
    localStorage.removeItem("jwt");
  };
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
      }}
    >
      <Menu
        mode="inline"
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub1"]}
        style={{ height: "100%", borderRight: 0, padding: 10 }}
      >
        <Menu.Item key="1" icon={<DashboardOutlined />}>
          <Link style={{ textDecoration: "none" }} to="dashboard">
            Dashboard
          </Link>
        </Menu.Item>
        {currentSemester && (
          <SubMenu
            key="sub1"
            icon={<ScheduleOutlined />}
            title="Kỳ học hiện tại"
          >
            <Menu.Item
              key="2"
              icon={<CalendarOutlined />}
              onClick={handleFetchCurrentSemesters}
            >
              <Link style={{ textDecoration: "none" }} to="current-semester">
                Thông tin kỳ học
              </Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<UsergroupAddOutlined />}>
              <Link
                style={{ textDecoration: "none" }}
                to="current-semester/pending-users"
              >
                Sinh viên chưa có lớp
              </Link>
            </Menu.Item>
          </SubMenu>
        )}
        <Menu.Item key="4" icon={<UnorderedListOutlined />}>
          <Link style={{ textDecoration: "none" }} to="semester-list">
            Danh sách kỳ học
          </Link>
        </Menu.Item>
        <Menu.Item key="5" icon={<BookOutlined />}>
          <Link style={{ textDecoration: "none" }} to="professionmanagement">
            Quản lí lĩnh vực
          </Link>
        </Menu.Item>
        <Menu.Item
          key="6"
          icon={
            <LogoutOutlined style={{ color: "red" }} onClick={handleLogout} />
          }
          onClick={handleLogout}
        >
          <span
            style={{ cursor: "pointer", color: "red" }}
          >
            Đăng xuất
          </span>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default AppSider;
