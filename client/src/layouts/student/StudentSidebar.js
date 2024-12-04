import React from "react";
import { Layout, Menu } from "antd";
import { DashboardOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import "../../style/Layouts/TeacherLayout.css";
import { GrGroup } from "react-icons/gr";

const { Sider } = Layout;

const StudentSidebar = ({ collapsed, toggleCollapse }) => {
  const location = useLocation();
  const selectedKey = location.pathname.split("/")[2];

  return (
    <Sider
      width={270}
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapse}
      className="site-layout-background"
      style={{
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
      }}
    >
      <Menu
        // theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={["dashboard"]}
        style={{
          height: "100%",
          borderRight: 0,
          padding: 10,
        }}
      >
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          <Link style={{ textDecoration: "none" }} to="dashboard">
            Trang chủ
          </Link>
        </Menu.Item>
        <Menu.Item
          key="class"
          style={{ marginLeft: 2 }}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="19"
              height="19"
              color="#000000"
              fill="none"
            >
              <path
                d="M7.5 19.5C7.5 18.5344 7.82853 17.5576 8.63092 17.0204C9.59321 16.3761 10.7524 16 12 16C13.2476 16 14.4068 16.3761 15.3691 17.0204C16.1715 17.5576 16.5 18.5344 16.5 19.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                cx="12"
                cy="11"
                r="2.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M17.5 11C18.6101 11 19.6415 11.3769 20.4974 12.0224C21.2229 12.5696 21.5 13.4951 21.5 14.4038V14.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                cx="17.5"
                cy="6.5"
                r="2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6.5 11C5.38987 11 4.35846 11.3769 3.50256 12.0224C2.77706 12.5696 2.5 13.4951 2.5 14.4038V14.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                cx="6.5"
                cy="6.5"
                r="2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
        >
          <Link style={{ textDecoration: "none" }} to="class">
            Lớp của bạn
          </Link>
        </Menu.Item>
        <Menu.Item
          key="group-detail"
          icon={<GrGroup className="custom-icon" />}
        >
          <Link style={{ textDecoration: "none" }} to="group-detail">
            Nhóm
          </Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default StudentSidebar;
