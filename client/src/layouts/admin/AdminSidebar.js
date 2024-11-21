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
      // collapsed={collapsed}
      // onCollapse={toggleCollapse}
      className="site-layout-background"
      style={{
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
      }}
    >
      <Menu
        mode="inline"
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["1"]}
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
                    d="M5.08069 15.2964C3.86241 16.0335 0.668175 17.5386 2.61368 19.422C3.56404 20.342 4.62251 21 5.95325 21H13.5468C14.8775 21 15.936 20.342 16.8863 19.422C18.8318 17.5386 15.6376 16.0335 14.4193 15.2964C11.5625 13.5679 7.93752 13.5679 5.08069 15.2964Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M13.5 7C13.5 9.20914 11.7091 11 9.5 11C7.29086 11 5.5 9.20914 5.5 7C5.5 4.79086 7.29086 3 9.5 3C11.7091 3 13.5 4.79086 13.5 7Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <path
                    d="M17 5L22 5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M17 8L22 8"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M20 11L22 11"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              }
              onClick={handleFetchCurrentSemesters}
            >
              <Link style={{ textDecoration: "none" }} to="current-semester">
                Quản lý người dùng
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
            <Menu.Item
              key="7"
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
                    d="M2 11C4.3317 8.55783 7.64323 8.44283 10 11M8.49509 4.5C8.49509 5.88071 7.37421 7 5.99153 7C4.60885 7 3.48797 5.88071 3.48797 4.5C3.48797 3.11929 4.60885 2 5.99153 2C7.37421 2 8.49509 3.11929 8.49509 4.5Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <path
                    d="M14 22C16.3317 19.5578 19.6432 19.4428 22 22M20.4951 15.5C20.4951 16.8807 19.3742 18 17.9915 18C16.6089 18 15.488 16.8807 15.488 15.5C15.488 14.1193 16.6089 13 17.9915 13C19.3742 13 20.4951 14.1193 20.4951 15.5Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <path
                    d="M3 14C3 17.87 6.13 21 10 21L9 19"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M15 3H21M15 6H21M15 9H18.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              }
            >
              <Link style={{ textDecoration: "none" }} to="list-request">
                Yêu cầu hỗ trợ
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
          <span style={{ cursor: "pointer", color: "red" }}>Đăng xuất</span>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default AppSider;
