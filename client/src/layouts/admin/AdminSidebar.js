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
import { Link, useLocation } from "react-router-dom";
import { GrGroup } from "react-icons/gr";
import { useSelector } from "react-redux";

const { Sider } = Layout;
const { SubMenu } = Menu;

const AppSider = ({
  collapsed,
  currentSemester,
  handleFetchCurrentSemesters,
  toggleCollapse,
}) => {
  const location = useLocation();
  const selectedKey = location.pathname.split("/")[2];
  const { sid } = useSelector((state) => state.semester);

  return (
    <Sider
      width={270}
      collapsible
      className="site-layout-background"
      style={{
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        marginTop: 60,
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={["sub1"]}
        style={{ height: "100%", borderRight: 0, padding: 10 }}
      >
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          <Link style={{ textDecoration: "none" }} to="dashboard">
            Dashboard
          </Link>
        </Menu.Item>
        {sid && (
          <>
            <Menu.Item
              key="current-semester"
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

            <Menu.Item key="class-manager" icon={<GrGroup />}>
              <Link style={{ textDecoration: "none" }} to="class-manager">
                Quản lý lớp học
              </Link>
            </Menu.Item>
          </>
        )}
        <Menu.Item key="semester-list" icon={<UnorderedListOutlined />}>
          <Link style={{ textDecoration: "none" }} to="semester-list">
            Danh sách kỳ học
          </Link>
        </Menu.Item>
        <Menu.Item key="professionmanagement" icon={<BookOutlined />}>
          <Link style={{ textDecoration: "none" }} to="professionmanagement">
            Quản lí lĩnh vực
          </Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default AppSider;
